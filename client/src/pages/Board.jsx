import React, { useState, useEffect, useRef, useCallback } from 'react';
import BoardSquare from '../components/BoardSquare';
import PropertyCard from '../components/PropertyCard';
import PropertiesCarousel from '../components/PropertiesCarousel';
import ToastContainer, { useToasts } from '../components/Toast';
import TradeDialog, { TradePrompt } from '../components/TradeDialog';
import AuctionDialog from '../components/AuctionDialog';
import StatsPanel from '../components/StatsPanel';
import VictoryScreen from '../components/VictoryScreen';
import GoAnimation from '../components/GoAnimation';
import CardDraw from '../components/CardDraw';
import BOARD_SPACES from '../data/boardSpaces';
import PROPERTY_DETAILS from '../data/propertyDetails';
import socket from '../socket';
import './Board.css';

const CROWN_NAMES = ['noddy', 'dev'];
function hasCrown(name) { return CROWN_NAMES.includes(name?.toLowerCase?.()); }

function PlayerName({ name, suffix }) {
  return (
    <>
      {hasCrown(name) && <span className="crown">👑</span>}
      {name}{suffix || ''}
    </>
  );
}

function getGridPosition(id) {
  if (id <= 10) return { row: 11, col: 11 - id, edge: 'bottom' };
  if (id <= 20) return { row: 11 - (id - 10), col: 1, edge: 'left' };
  if (id <= 30) return { row: 1, col: 1 + (id - 20), edge: 'top' };
  return { row: 1 + (id - 30), col: 11, edge: 'right' };
}

const GROUP_COLORS = {
  brown: '#8B4513', lightblue: '#AAD8E6', pink: '#D93A96', orange: '#F7941D',
  red: '#ED1B24', yellow: '#FDEF44', green: '#1FB25A', darkblue: '#0072BB',
  railroad: '#444', utility: '#444',
};

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function Board({ initialState, roomCode, socketId, onReturnToLobby }) {
  // ── Core State ──────────────────────────────────────────────────
  const [players, setPlayers] = useState(initialState.players || []);
  const [currentPlayerId, setCurrentPlayerId] = useState(initialState.currentPlayerId || null);
  const [properties, setProperties] = useState(initialState.properties || {});
  const [dice, setDice] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [buyOption, setBuyOption] = useState(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rightPanelPlayer, setRightPanelPlayer] = useState(null);
  const [landedSpace, setLandedSpace] = useState(null);
  const [highlightedSquare, setHighlightedSquare] = useState(null);
  const [moneyDeltas, setMoneyDeltas] = useState({});
  const [animatingToken, setAnimatingToken] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('manipaly-dark') === 'true');
  const { toasts, addToast } = useToasts();

  // ── New Feature State ───────────────────────────────────────────
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [incomingTrade, setIncomingTrade] = useState(null);
  const [auction, setAuction] = useState(null);
  const [winner, setWinner] = useState(initialState.winner || null);
  const [goTrigger, setGoTrigger] = useState(0);
  const [drawnCard, setDrawnCard] = useState(null);

  const logRef = useRef(null);
  const isMyTurn = currentPlayerId === socketId;
  const me = players.find((p) => p.id === socketId);
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const myInJail = me?.inJail || false;

  // ── Dark mode toggle ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('manipaly-dark', darkMode);
  }, [darkMode]);

  // ── Auto-scroll log ─────────────────────────────────────────────
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // ── Money delta auto-clear ──────────────────────────────────────
  const showMoneyDelta = useCallback((playerId, amount) => {
    setMoneyDeltas((prev) => ({ ...prev, [playerId]: amount }));
    setTimeout(() => {
      setMoneyDeltas((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    }, 1600);
  }, []);

  // ── Token movement animation ────────────────────────────────────
  const animateMovement = useCallback((playerId, from, to, callback) => {
    const steps = [];
    let pos = from;
    while (pos !== to) {
      pos = (pos + 1) % 40;
      steps.push(pos);
    }
    if (steps.length === 0) { callback(); return; }

    let i = 0;
    setAnimatingToken({ playerId, position: from });
    const interval = setInterval(() => {
      if (i < steps.length) {
        setAnimatingToken({ playerId, position: steps[i] });
        i++;
      } else {
        clearInterval(interval);
        setAnimatingToken(null);
        callback();
      }
    }, 180);
  }, []);

  // ── Process dice result after animation ─────────────────────────
  const processResult = useCallback((result) => {
    const spaceName = BOARD_SPACES.find((s) => s.id === result.newPosition)?.name || `Space ${result.newPosition}`;
    addLog(`🎲 ${result.playerName} rolled ${result.die1}+${result.die2} = ${result.total} → ${spaceName}`);

    if (result.passedGo) {
      addLog(`💰 ${result.playerName} passed GO — collected $200`);
      addToast(`${result.playerName} collected $200!`, 'go');
      showMoneyDelta(result.playerId, +200);
      setGoTrigger((v) => v + 1);
    }

    // Landed-on card
    const space = BOARD_SPACES.find((s) => s.id === result.newPosition);
    setLandedSpace({ spaceId: result.newPosition, playerName: result.playerName, spaceName: space?.name || spaceName });

    // Highlight the landed square
    setHighlightedSquare(result.newPosition);
    setTimeout(() => setHighlightedSquare(null), 2200);

    if (result.landingAction) {
      const action = result.landingAction;
      if (action.type === 'tax') {
        addLog(`📋 ${result.playerName} paid $${action.amount} in tax`);
        addToast(`${result.playerName} paid $${action.amount} tax`, 'tax');
        showMoneyDelta(result.playerId, -action.amount);
      } else if (action.type === 'rent') {
        addLog(`🏠 ${result.playerName} paid $${action.rent} rent to ${action.ownerName}`);
        addToast(`${result.playerName} paid $${action.rent} rent to ${action.ownerName}`, 'rent');
        showMoneyDelta(result.playerId, -action.rent);
        showMoneyDelta(action.ownerId, +action.rent);
      } else if (action.type === 'buy_option') {
        if (result.playerId === socketId) {
          setBuyOption({ spaceId: action.spaceId, price: action.price, name: spaceName });
        }
      } else if (action.type === 'own_property') {
        addLog(`🏠 ${result.playerName} landed on own property`);
      } else if (action.type === 'go_to_jail') {
        addLog(`👮 ${result.playerName} was sent to JAIL!`);
        addToast(`${result.playerName} goes to jail!`, 'info');
      } else if (action.type === 'mortgaged_property') {
        addLog(`🏚️ ${result.playerName} landed on a mortgaged property`);
      } else if (action.type === 'card') {
        // Show card draw animation
        setDrawnCard({ text: action.card.text, deckType: action.deckType });
        const deckLabel = action.deckType === 'chance' ? 'Chance' : 'Community Chest';
        addLog(`🃏 ${result.playerName} drew ${deckLabel}: "${action.card.text}"`);
        addToast(`${deckLabel}: ${action.card.text}`, 'info');

        if (action.moneyDelta) {
          showMoneyDelta(result.playerId, action.moneyDelta);
        }
        if (action.newPosition !== undefined && action.newPosition !== result.newPosition) {
          // Card moved the player — animate to new position
          animateMovement(result.playerId, result.newPosition, action.newPosition, () => {});
          result.newPosition = action.newPosition;
          if (action.passedGo) {
            addLog(`💰 ${result.playerName} passed GO — collected $200`);
            showMoneyDelta(result.playerId, +200);
            setGoTrigger((v) => v + 1);
          }
        }
        if (action.buyOption && result.playerId === socketId) {
          const bName = BOARD_SPACES.find((s) => s.id === action.buyOption.spaceId)?.name || 'property';
          setBuyOption({ spaceId: action.buyOption.spaceId, price: action.buyOption.price, name: bName });
        }
        if (action.jailFreeCard) {
          addLog(`🔑 ${result.playerName} got a Get Out of Jail Free card!`);
        }
      }

      if (action.bankrupt) {
        addLog(`💀 ${result.playerName} went BANKRUPT!`);
        addToast(`${result.playerName} went bankrupt!`, 'info');
      }
    }

    if (result.playerId === socketId) {
      setHasRolled(true);
    }

    // Update player
    setPlayers((prev) => prev.map((p) =>
      p.id === result.playerId ? { ...p, position: result.newPosition, money: result.money } : p
    ));
  }, [socketId, addToast, showMoneyDelta]);

  // ═══════════════════════════════════════════════════════════════
  // SOCKET EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    socket.on('GAME_STATE_UPDATE', (state) => {
      if (!animatingToken) {
        setPlayers(state.players);
      }
      setCurrentPlayerId(state.currentPlayerId);
      setProperties(state.properties || {});
      if (state.winner) setWinner(state.winner);
    });

    socket.on('DICE_ROLLED', (result) => {
      setDiceRolling(true);
      const rollDuration = 800;
      const rollInterval = 60;
      let elapsed = 0;
      const ticker = setInterval(() => {
        setDice({
          die1: Math.floor(Math.random() * 6) + 1,
          die2: Math.floor(Math.random() * 6) + 1,
        });
        elapsed += rollInterval;
        if (elapsed >= rollDuration) {
          clearInterval(ticker);
          setDice({ die1: result.die1, die2: result.die2 });
          setDiceRolling(false);
          animateMovement(result.playerId, result.oldPosition, result.newPosition, () => {
            processResult(result);
          });
        }
      }, rollInterval);
    });

    socket.on('PROPERTY_BOUGHT', (result) => {
      const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || `Space ${result.spaceId}`;
      addLog(`🏗️ ${result.ownerName} bought ${spaceName} for $${result.price}`);
      addToast(`${result.ownerName} bought ${spaceName}!`, 'buy');
      showMoneyDelta(result.ownerId, -result.price);
      setBuyOption(null);
    });

    socket.on('PASS_ACKNOWLEDGED', () => {
      setBuyOption(null);
    });

    socket.on('TURN_CHANGED', (result) => {
      setCurrentPlayerId(result.currentPlayerId);
      setDice(null);
      setHasRolled(false);
      setBuyOption(null);
      setLandedSpace(null);
      addLog(`➡️ Now: ${result.currentPlayerName}'s turn${result.inJail ? ' (in jail)' : ''}`);
    });

    // ── Jail Events ───────────────────────────────────────────────
    socket.on('JAIL_UPDATE', (result) => {
      addLog(`🔓 ${result.playerName} paid $50 to get out of jail`);
      addToast(`${result.playerName} paid $50 bail`, 'tax');
      showMoneyDelta(result.playerId, -50);
    });

    socket.on('JAIL_ROLL_RESULT', (result) => {
      if (result.freed) {
        addLog(`🎲 ${result.playerName} rolled doubles and escaped jail!`);
        addToast(`${result.playerName} escaped jail!`, 'go');
        if (result.die1 && result.die2) {
          setDice({ die1: result.die1, die2: result.die2 });
          // Animate movement after jail escape
          if (result.oldPosition !== undefined && result.newPosition !== undefined) {
            animateMovement(result.playerId, result.oldPosition, result.newPosition, () => {
              processResult(result);
            });
          }
        }
      } else if (result.forcedPay) {
        addLog(`💸 ${result.playerName} forced to pay $50 after 3 failed attempts`);
        addToast(`${result.playerName} forced to pay $50 bail`, 'tax');
        showMoneyDelta(result.playerId, -50);
      } else {
        setDice({ die1: result.die1, die2: result.die2 });
        addLog(`🔒 ${result.playerName} failed to roll doubles (${result.attemptsLeft} left)`);
        addToast(`${result.playerName} stays in jail (${result.attemptsLeft} tries left)`, 'info');
        setHasRolled(true); // They've used their jail roll
      }
    });

    // ── House Built ───────────────────────────────────────────────
    socket.on('HOUSE_BUILT', (result) => {
      const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || `Space ${result.spaceId}`;
      const level = result.houses === 5 ? '🏨 hotel' : `🏠 house #${result.houses}`;
      addLog(`🏠 ${result.playerName} built ${level} on ${spaceName}`);
      addToast(`${result.playerName} built ${level} on ${spaceName}`, 'buy');
      showMoneyDelta(result.playerId, -result.cost);
    });

    // ── Mortgage ──────────────────────────────────────────────────
    socket.on('PROPERTY_MORTGAGED', (result) => {
      const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || `Space ${result.spaceId}`;
      addLog(`🏚️ ${result.playerName} mortgaged ${spaceName} for $${result.mortgageValue}`);
      addToast(`${result.playerName} mortgaged ${spaceName}`, 'info');
      showMoneyDelta(result.playerId, +result.mortgageValue);
    });

    socket.on('PROPERTY_UNMORTGAGED', (result) => {
      const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || `Space ${result.spaceId}`;
      addLog(`🏠 ${result.playerName} unmortgaged ${spaceName}`);
      addToast(`${result.playerName} unmortgaged ${spaceName}`, 'buy');
      showMoneyDelta(result.playerId, -result.cost);
    });

    // ── Trading ───────────────────────────────────────────────────
    socket.on('TRADE_PROPOSED', (trade) => {
      setShowTradeDialog(false);
      if (trade.toId === socketId) {
        setIncomingTrade(trade);
      } else {
        addLog(`💱 ${trade.fromName} proposed a trade to ${trade.toName}`);
      }
    });

    socket.on('TRADE_RESOLVED', (result) => {
      setIncomingTrade(null);
      if (result.accepted) {
        addLog(`✅ Trade accepted: ${result.trade.fromName} ↔ ${result.trade.toName}`);
        addToast(`Trade completed!`, 'buy');
      } else {
        addLog(`❌ Trade rejected by ${result.trade.toName}`);
        addToast(`Trade rejected`, 'info');
      }
    });

    // ── Auction ───────────────────────────────────────────────────
    socket.on('AUCTION_STARTED', (auctionData) => {
      setBuyOption(null);
      setAuction(auctionData);
      const spaceName = BOARD_SPACES.find((s) => s.id === auctionData.spaceId)?.name || 'Property';
      addLog(`🔨 Auction started for ${spaceName}!`);
      addToast(`Auction started for ${spaceName}!`, 'info');
    });

    socket.on('AUCTION_BID', (result) => {
      setAuction((prev) => prev ? { ...prev, highBid: result.highBid, highBidder: result.highBidder, highBidderName: result.highBidderName } : prev);
      addLog(`💰 ${result.highBidderName} bid $${result.highBid}`);
    });

    socket.on('AUCTION_ENDED', (result) => {
      setAuction(null);
      if (result.sold) {
        const spaceName = BOARD_SPACES.find((s) => s.id === result.spaceId)?.name || 'Property';
        addLog(`🔨 ${result.winnerName} won the auction for ${spaceName} at $${result.winningBid}`);
        addToast(`${result.winnerName} won the auction!`, 'buy');
        showMoneyDelta(result.winnerId, -result.winningBid);
      } else {
        addLog(`🔨 Auction ended — no bids`);
      }
    });

    // ── Bankruptcy / Game Over ─────────────────────────────────────
    socket.on('PLAYER_BANKRUPT', ({ playerId, playerName }) => {
      addLog(`💀 ${playerName} went BANKRUPT!`);
      addToast(`${playerName} went bankrupt!`, 'info');
    });

    socket.on('GAME_OVER', (winnerData) => {
      setWinner(winnerData);
      addLog(`🏆 ${winnerData.name} WINS THE GAME!`);
      addToast(`🏆 ${winnerData.name} wins!`, 'go');
    });

    socket.on('PLAYER_LEFT', ({ players }) => {
      setPlayers(players);
      addLog(`👋 A player left`);
    });

    socket.on('ERROR', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      const events = [
        'GAME_STATE_UPDATE', 'DICE_ROLLED', 'PROPERTY_BOUGHT', 'PASS_ACKNOWLEDGED',
        'TURN_CHANGED', 'JAIL_UPDATE', 'JAIL_ROLL_RESULT', 'HOUSE_BUILT',
        'PROPERTY_MORTGAGED', 'PROPERTY_UNMORTGAGED',
        'TRADE_PROPOSED', 'TRADE_RESOLVED',
        'AUCTION_STARTED', 'AUCTION_BID', 'AUCTION_ENDED',
        'PLAYER_BANKRUPT', 'GAME_OVER', 'PLAYER_LEFT', 'ERROR',
      ];
      events.forEach((e) => socket.off(e));
    };
  }, [socketId, animateMovement, processResult]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  function addLog(msg) { setLog((prev) => [...prev.slice(-50), msg]); }
  function handleRoll() { socket.emit('ROLL_DICE', { code: roomCode }); }
  function handleBuy() { if (buyOption) socket.emit('BUY_PROPERTY', { code: roomCode, spaceId: buyOption.spaceId }); }
  function handlePass() { socket.emit('PASS_PROPERTY', { code: roomCode, spaceId: buyOption?.spaceId }); setBuyOption(null); }
  function handleEndTurn() { socket.emit('END_TURN', { code: roomCode }); }
  function handlePayJailFine() { socket.emit('PAY_JAIL_FINE', { code: roomCode }); }
  function handleRollForJail() { socket.emit('ROLL_FOR_JAIL', { code: roomCode }); }
  function handleSquareClick(spaceId) { if (PROPERTY_DETAILS[spaceId]) setSelectedProperty(spaceId); }

  function handleBuildHouse(spaceId) {
    socket.emit('BUILD_HOUSE', { code: roomCode, spaceId });
  }
  function handleMortgage(spaceId) {
    socket.emit('MORTGAGE_PROPERTY', { code: roomCode, spaceId });
  }
  function handleUnmortgage(spaceId) {
    socket.emit('UNMORTGAGE_PROPERTY', { code: roomCode, spaceId });
  }

  function handleProposeTrade(tradeData) {
    socket.emit('PROPOSE_TRADE', { code: roomCode, ...tradeData });
    setShowTradeDialog(false);
  }
  function handleRespondTrade(accept) {
    socket.emit('RESPOND_TRADE', { code: roomCode, accept });
    setIncomingTrade(null);
  }
  function handleBid(amount) {
    socket.emit('PLACE_BID', { code: roomCode, amount });
  }

  // ── Derived values ──────────────────────────────────────────────
  function countProps(playerId) {
    return Object.values(properties).filter((v) => v.ownerId === playerId).length;
  }

  function getEffectivePosition(player) {
    if (animatingToken && animatingToken.playerId === player.id) return animatingToken.position;
    return player.position;
  }

  // Build a map of ownerId → color for ownership borders
  const ownerColorMap = {};
  players.forEach((p) => { ownerColorMap[p.id] = p.color; });

  const landedDetail = landedSpace ? PROPERTY_DETAILS[landedSpace.spaceId] : null;
  const landedColor = landedDetail ? GROUP_COLORS[landedDetail.group] || '#444' : null;
  const isAnimating = diceRolling || animatingToken !== null;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="game">
      {/* Floating overlays */}
      <ToastContainer toasts={toasts} />
      <GoAnimation trigger={goTrigger} />

      {/* Victory Screen */}
      {winner && (
        <VictoryScreen
          winnerName={typeof winner === 'string' ? players.find((p) => p.id === winner)?.name : winner.name}
          players={players}
          onClose={onReturnToLobby || (() => {})}
        />
      )}

      {/* Trade Dialog */}
      {showTradeDialog && (
        <TradeDialog
          myId={socketId}
          players={players}
          properties={properties}
          onPropose={handleProposeTrade}
          onClose={() => setShowTradeDialog(false)}
        />
      )}

      {/* Incoming Trade Prompt */}
      {incomingTrade && (
        <TradePrompt trade={incomingTrade} onRespond={handleRespondTrade} />
      )}

      {/* Auction Dialog */}
      {auction && (
        <AuctionDialog
          auction={auction}
          myId={socketId}
          players={players}
          onBid={handleBid}
        />
      )}

      {/* ── Left Panel ──────────────────────────────────────────── */}
      <div className="game__panel">
        <div className="game__title-row">
          <h2 className="game__title">MANIPALY</h2>
          <button
            className="dark-toggle"
            onClick={() => setDarkMode((v) => !v)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Turn */}
        <div className="panel__section">
          <div className={`panel__turn ${!isMyTurn ? 'panel__turn--waiting' : ''}`}>
            {currentPlayer && (
              <>
                <span className="panel__dot" style={{ backgroundColor: currentPlayer.color }} />
                <span>
                  <PlayerName name={currentPlayer.name} />
                  {currentPlayer.id === socketId ? " — Your turn" : "'s turn"}
                  {currentPlayer.inJail && ' 🔒'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dice */}
        {dice && (
          <div className={`panel__section panel__dice ${diceRolling ? 'panel__dice--rolling' : 'panel__dice--settled'}`}>
            <div className={`dice ${diceRolling ? 'dice--shake' : ''}`}>
              <span className="dice__face">{DICE_FACES[dice.die1]}</span>
            </div>
            <div className={`dice ${diceRolling ? 'dice--shake' : ''}`}>
              <span className="dice__face">{DICE_FACES[dice.die2]}</span>
            </div>
          </div>
        )}

        {/* Landed-on Card */}
        {landedSpace && (
          <div className="panel__section panel__landed anim-fade-in">
            <div
              className="landed-card"
              onClick={() => landedDetail && handleSquareClick(landedSpace.spaceId)}
              title={landedDetail ? 'Click for full details' : ''}
              style={{ cursor: landedDetail ? 'pointer' : 'default' }}
            >
              {landedColor && <div className="landed-card__band" style={{ backgroundColor: landedColor }} />}
              {!landedColor && <div className="landed-card__band landed-card__band--neutral" />}
              <div className="landed-card__info">
                <span className="landed-card__name">{landedDetail?.name || landedSpace.spaceName}</span>
                <span className="landed-card__group">{landedDetail?.groupLabel || ''}</span>
              </div>
              {landedDetail && (
                <div className="landed-card__stats">
                  <span className="landed-card__price">${landedDetail.price}</span>
                  <span className="landed-card__rent">Rent ${landedDetail.rent}</span>
                </div>
              )}
              <span className="landed-card__by">{landedSpace.playerName}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="panel__section panel__actions">
          {/* Jail actions */}
          {isMyTurn && myInJail && !isAnimating && !hasRolled && (
            <div className="panel__jail-actions anim-fade-in">
              <div className="panel__jail-label">🔒 You're in Jail!</div>
              <div className="panel__jail-btns">
                <button className="btn btn--jail-pay" onClick={handlePayJailFine}>Pay $50 Bail</button>
                <button className="btn btn--jail-roll" onClick={handleRollForJail}>🎲 Roll Doubles</button>
              </div>
            </div>
          )}

          {/* Normal roll */}
          {isMyTurn && !hasRolled && !buyOption && !isAnimating && !myInJail && (
            <button className="btn btn--roll btn--pulse" onClick={handleRoll}>🎲 Roll Dice</button>
          )}

          {/* Buy prompt */}
          {buyOption && (
            <div className="panel__buy anim-fade-in">
              <p className="panel__buy-title">Buy {buyOption.name}?</p>
              <p className="panel__buy-price">${buyOption.price}</p>
              <div className="panel__buy-btns">
                <button className="btn btn--buy" onClick={handleBuy}>Buy</button>
                <button className="btn btn--pass" onClick={handlePass}>Pass (Auction)</button>
              </div>
            </div>
          )}

          {/* End turn + Trade button */}
          {isMyTurn && hasRolled && !buyOption && !isAnimating && (
            <div className="panel__end-row anim-fade-in">
              <button className="btn btn--end" onClick={handleEndTurn}>End Turn ➡️</button>
              <button className="btn btn--trade" onClick={() => setShowTradeDialog(true)}>💱 Trade</button>
            </div>
          )}
        </div>

        {error && <div className="panel__error anim-fade-in">{error}</div>}

        {/* Your Properties — with build/mortgage actions */}
        <div className="panel__section">
          <h3 className="panel__heading">Your Properties</h3>
          <PropertiesCarousel
            properties={properties}
            playerId={socketId}
            onPropertyClick={handleSquareClick}
            onBuild={handleBuildHouse}
            onMortgage={handleMortgage}
            onUnmortgage={handleUnmortgage}
          />
        </div>

        {/* Stats Panel */}
        <StatsPanel players={players} properties={properties} myId={socketId} />

        {/* Players */}
        <div className="panel__section">
          <h3 className="panel__heading">Players</h3>
          <div className="panel__players">
            {players.map((p) => (
              <div
                key={p.id}
                className={`panel__player ${p.id === currentPlayerId ? 'panel__player--active' : ''} ${p.id === rightPanelPlayer ? 'panel__player--inspecting' : ''} ${p.bankrupt ? 'panel__player--bankrupt' : ''}`}
                onClick={() => !p.bankrupt && setRightPanelPlayer(p.id === rightPanelPlayer ? null : p.id)}
                title={p.bankrupt ? 'Bankrupt' : 'Click to view properties'}
              >
                <span className="panel__dot" style={{ backgroundColor: p.color }} />
                <span className="panel__player-name">
                  <PlayerName name={p.name} suffix={p.id === socketId ? ' (You)' : ''} />
                  {p.inJail && ' 🔒'}
                  {p.bankrupt && ' 💀'}
                </span>
                <span className="panel__player-props">{countProps(p.id)} 🏠</span>
                <span className="panel__player-money">
                  ${p.money}
                  {moneyDeltas[p.id] !== undefined && (
                    <span className={`money-delta ${moneyDeltas[p.id] >= 0 ? 'money-delta--up' : 'money-delta--down'}`}>
                      {moneyDeltas[p.id] >= 0 ? '+' : ''}{moneyDeltas[p.id]}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="panel__section panel__log-section">
          <h3 className="panel__heading">Game Log</h3>
          <div className="panel__log" ref={logRef}>
            {log.length === 0 && <span className="panel__log-empty">Game started!</span>}
            {log.map((msg, i) => (
              <div key={i} className="panel__log-entry">{msg}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board ──────────────────────────────────────────────── */}
      <div className="game__board">
        <div className="board-grid">
          {BOARD_SPACES.map((space) => {
            const { row, col, edge } = getGridPosition(space.id);
            const onSpace = players.filter((p) => !p.bankrupt && getEffectivePosition(p) === space.id);
            const owner = properties[space.id];
            const isHighlighted = highlightedSquare === space.id;
            const ownerColor = owner ? ownerColorMap[owner.ownerId] : null;
            return (
              <div
                key={space.id}
                className={`board-cell ${isHighlighted ? 'board-cell--highlight' : ''}`}
                style={{ gridRow: row, gridColumn: col }}
              >
                <BoardSquare
                  space={space}
                  players={onSpace}
                  edge={edge}
                  owner={owner}
                  ownerColor={ownerColor}
                  onClick={handleSquareClick}
                />
              </div>
            );
          })}
          <div className="board-center">
            <div className="board-center__inner">
              <div className="board-center__decks">
                <div className="board-center__deck">
                  <div className="board-center__deck-stack board-center__deck-stack--chest">
                    <span className="board-center__deck-icon">📦</span>
                  </div>
                  <span className="board-center__deck-label">Community Chest</span>
                </div>
              </div>
              <img className="board-center__logo" src="/assets/Gemini_Generated_Image_cwgdnicwgdnicwgd-removebg-preview.png" alt="MANIPALY" />
              <div className="board-center__decks">
                <div className="board-center__deck">
                  <div className="board-center__deck-stack board-center__deck-stack--chance">
                    <span className="board-center__deck-icon">❓</span>
                  </div>
                  <span className="board-center__deck-label">Chance</span>
                </div>
              </div>
              <div className="board-center__dice">🎲</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────── */}
      {rightPanelPlayer && (
        <div className="game__right-panel anim-slide-left">
          <div className="rpanel__header">
            <span className="rpanel__dot" style={{ backgroundColor: players.find((p) => p.id === rightPanelPlayer)?.color }} />
            <span className="rpanel__name">
              <PlayerName name={players.find((p) => p.id === rightPanelPlayer)?.name} suffix="'s Properties" />
            </span>
            <button className="rpanel__close" onClick={() => setRightPanelPlayer(null)}>✕</button>
          </div>
          <div className="rpanel__body">
            <PropertiesCarousel properties={properties} playerId={rightPanelPlayer} onPropertyClick={handleSquareClick} />
          </div>
        </div>
      )}

      {/* ── Property Popup ─────────────────────────────────────── */}
      {selectedProperty !== null && (
        <PropertyCard
          spaceId={selectedProperty}
          owner={properties[selectedProperty] || null}
          myId={socketId}
          onClose={() => setSelectedProperty(null)}
          onBuild={handleBuildHouse}
          onMortgage={handleMortgage}
          onUnmortgage={handleUnmortgage}
        />
      )}

      {/* ── Card Draw Animation ──────────────────────────────────── */}
      {drawnCard && (
        <CardDraw card={drawnCard} onDone={() => setDrawnCard(null)} />
      )}
    </div>
  );
}
