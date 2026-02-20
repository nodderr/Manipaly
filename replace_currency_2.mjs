import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Board.jsx fixes
  code = code.replace(/>\$/g, '>₹');
  code = code.replace(/\$</g, '₹<');
  code = code.replace(/Rent \$/g, 'Rent ₹');
  code = code.replace(/^(\s*)\$(\{?[A-Za-z0-9_.]+\}?)/gm, '$1₹$2');
  code = code.replace(/\$\+/g, '₹+');
  code = code.replace(/\$-/g, '₹-');
  
  // Ensure we don't mess up JS template literals. 
  // Any ₹{var} without a preceding \ needs to stay as ${var} in JS context BUT wait, 
  // if it was a literal $ followed by {var} in JSX, it should be ₹{var}. 
  // Actually, in JSX, `${var}` evaluates the JS expression, so it just prints the var. To print a dollar sign before it, you do `${var}`. 
  // So `${var}` actually renders literally as "$ <value>".
  // Wait, no. If the code says:
  // <span className="landed-card__price">${landedDetail.price}</span>
  // Then the `$` is literally text, and `{landedDetail.price}` is the evaluated variable!
  // Same for `${p.money}`.
  // We can just replace all instances of literal `$` followed by `{` in JSX contexts.
  
  // Let's manually replace the known ones:
  code = code.replace(/\$\{landedDetail.price\}/g, '₹{landedDetail.price}');
  code = code.replace(/\$\{buyOption.price\}/g, '₹{buyOption.price}');
  code = code.replace(/\$\{p.money\}/g, '₹{p.money}');
  code = code.replace(/Rent \$\{landedDetail.rent\}/g, 'Rent ₹{landedDetail.rent}');
  
  if (code !== fs.readFileSync(filePath, 'utf-8')) {
    fs.writeFileSync(filePath, code);
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir('./client/src');
console.log('Done.');
