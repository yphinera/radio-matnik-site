// Contrôle léger des pages HTML, sans dépendance : structure de base
// (doctype, langue, titre, viewport, charset) et liens locaux existants.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const racine = process.cwd();
const pages = readdirSync(racine).filter((f) => f.endsWith('.html'));
const erreurs = [];

for (const page of pages) {
  const html = readFileSync(join(racine, page), 'utf8');
  const exiger = (cond, msg) => { if (!cond) erreurs.push(`${page} : ${msg}`); };
  exiger(/^\s*<!doctype html>/i.test(html), 'doctype HTML5 manquant');
  exiger(/<html[^>]*\slang="[^"]+"/i.test(html), 'attribut lang manquant sur <html>');
  exiger(/<title>[^<]+<\/title>/i.test(html), '<title> manquant ou vide');
  exiger(/<meta[^>]+charset=/i.test(html), 'meta charset manquant');
  exiger(/<meta[^>]+name="viewport"/i.test(html), 'meta viewport manquant');

  for (const [, cible] of html.matchAll(/\s(?:href|src)="([^"]+)"/gi)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(cible)) continue; // externe, mailto, ancre
    const chemin = cible.split(/[?#]/)[0];
    if (!chemin) continue;
    const fichier = chemin.startsWith('/') ? join(racine, chemin) : join(dirname(join(racine, page)), chemin);
    exiger(existsSync(fichier), `lien local introuvable : ${cible}`);
  }
}

if (erreurs.length) {
  console.error(erreurs.join('\n'));
  process.exit(1);
}
console.log(`${pages.length} page(s) HTML vérifiée(s) : ${pages.join(', ')}`);
