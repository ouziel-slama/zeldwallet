# Objectif

Intégrer `zeldhash-miner` dans `zeldwallet` pour que les utilisateurs puissent générer des transactions commençant par des zéros afin de gagner des Zeld.

- Code source de zeldhash-miner : `/Users/ouziel/Work/zeldhash/zeldhash-miner`
- `zeldhash-miner` contient de la documentation et une démo complète.

---

# Phase 1 : Mise en place de l'interface

Au-dessus du footer, ajouter une zone séparée des adresses et des balances de la même manière (avec une fine ligne horizontale).

À l'intérieur de cette zone, de gauche à droite :
- Une case à cocher **« Send BTC »** (enabled uniquement si `balance BTC payment >= DUST + MIN_FEE_RESERVE`)
- Une case à cocher **« Send Zeld »** (enabled uniquement si `balance ZELD > 0` et `balance BTC totale >= 2 * DUST + MIN_FEE_RESERVE`)
- Un petit slider **« Zero Count »** permettant de choisir entre 6 et 10 zéros
- Une case à cocher **« Use GPU »**
- Un bouton **« Hunt »** avec un pictogramme représentant une cible

**Constantes :**
```typescript
const DUST = 330;              // sats, minimum pour output Taproot/SegWit
const MIN_FEE_RESERVE = 1500;  // sats, estimation conservative des fees
```

**Conditions d'activation du bouton Hunt :**
- Hunt simple (aucune case cochée) : `balance BTC payment >= DUST + MIN_FEE_RESERVE` (1830 sats)
- Send BTC coché : `balance BTC payment >= btc_output.amount + DUST + MIN_FEE_RESERVE` ET champs adresse et montant valides
- Send Zeld coché : `balance BTC totale >= 2 * DUST + MIN_FEE_RESERVE` (2160 sats) ET `balance ZELD >= zeld_output.amount` ET champs adresse et montant valides

**Note :** Ces seuils sont des estimations conservatives pour la validation UI. La fonction `prepareMinerArgs()` calcule les fees exacts en fonction de la taille réelle de la transaction et remonte une erreur `INSUFFICIENT_FUNDS` si les fonds sont insuffisants.

**Validation des champs de saisie :**
- L'adresse doit être une adresse Bitcoin valide.
- Le montant doit être un nombre positif, inférieur ou égal à la balance disponible.

**Comportements :**
- Au rollover du bouton Hunt quand il est disabled, afficher un message explicatif adapté au contexte.
- On ne doit pas pouvoir cocher les deux cases « Send BTC » et « Send Zeld » simultanément : soit aucune, soit une seule des deux.
- Quand on coche « Send BTC », une ligne supplémentaire apparaît au-dessus de la ligne contenant le bouton « Hunt », avec un champ pour saisir une adresse Bitcoin et un champ pour saisir un montant BTC.
- Idem quand on coche « Send Zeld », avec un champ pour saisir une adresse Bitcoin et un champ pour saisir un montant Zeld.

**Action du bouton Hunt :**

Quand on clique sur « Hunt », appeler la fonction :

```typescript
startHunting(
  payment_address,
  payment_utxos,   // liste des UTXOs de l'adresse de payment
  ordinals_address,
  ordinals_utxos,  // liste des UTXOs de l'adresse Ordinals
  target,          // nombre de zéros (6-10)
  useGpu,          // booléen, utiliser le GPU
  btc_output,      // { address, amount } — optionnel, si Send BTC
  zeld_output,     // { address, amount } — optionnel, si Send Zeld
)
```

Dans cette première phase, la fonction ne fait rien à part logger les paramètres.

## Checklist Phase 1

- [ ] Ajouter la zone de hunting sous les balances avec séparateur horizontal
- [ ] Implémenter la checkbox "Send BTC" avec condition d'activation (`balance >= DUST + MIN_FEE_RESERVE`)
- [ ] Implémenter la checkbox "Send Zeld" avec conditions d'activation (balance Zeld > 0 et balance BTC >= 2160 sats)
- [ ] Ajouter la logique de mutuelle exclusivité entre les deux checkboxes
- [ ] Créer le slider "Zero Count" (range 6-10)
- [ ] Ajouter la checkbox "Use GPU"
- [ ] Créer le bouton "Hunt" avec icône cible
- [ ] Implémenter les tooltips explicatifs au rollover du bouton Hunt désactivé
- [ ] Ajouter les champs conditionnels (adresse + montant) pour "Send BTC"
- [ ] Ajouter les champs conditionnels (adresse + montant) pour "Send Zeld"
- [ ] Implémenter la validation des adresses Bitcoin
- [ ] Implémenter la validation des montants (positif, <= balance)
- [ ] Créer la fonction `startHunting()` avec logging des paramètres

---

# Phase 2 : Préparation des helpers

**Prérequis :** Avant de commencer cette phase, lire attentivement la documentation et l'exemple :
- `/Users/ouziel/Work/zeldhash/zeldhash-miner/facades/typescript/README.md`
- `/Users/ouziel/Work/zeldhash/zeldhash-miner/examples/web-demo`

Préparer les helpers chargés de construire les paramètres à passer à `zeldhash-miner`.

Le helper doit gérer les 3 cas suivants :
1. Hunt simple (sans envoi de BTC ou Zeld)
2. Hunt avec envoi de BTC
3. Hunt avec envoi de Zeld

**Signature :**

```typescript
prepareMinerArgs(
  payment_address,
  payment_utxos,   // liste des UTXOs de l'adresse de payment
  ordinals_address,
  ordinals_utxos,  // liste des UTXOs de l'adresse Ordinals (avec pour chacun la balance Zeld)
  target,          // nombre de zéros (6-10)
  useGpu,          // booléen, utiliser le GPU
  btc_output,      // { address, amount } — optionnel, si Send BTC
  zeld_output,     // { address, amount } — optionnel, si Send Zeld
)
```

**Retour :**

```typescript
{
  inputs: [/* ... */],
  outputs: [/* ... */],
  targetZeros: 6,
  useGpu: true,
  distribution: [800n, 200n], // optionnel, [change_zeld, zeld_output.amount]
}
```

**Note sur les unités :** Tous les montants passés au miner doivent être exprimés en sats (1 BTC = 100 000 000 sats). ZELD utilise également 8 décimales, comme BTC.

**Structure des inputs pour le miner :**

```typescript
interface TxInput {
  txid: string;
  vout: number;
  scriptPubKey: string;  // hex, généré depuis l'adresse
  amount: number;        // sats
}
```

Le `scriptPubKey` doit être généré depuis l'adresse (pas besoin d'appel API) :

```typescript
import * as bitcoin from 'bitcoinjs-lib';

function addressToScriptPubKey(address: string): string {
  return bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin).toString('hex');
}
```

**Structure des outputs pour le miner :**

```typescript
interface TxOutput {
  address: string;
  amount?: number;  // requis sauf si change: true
  change: boolean;
}
```

## Algorithmes par cas

**Règle générale sur les outputs :**
- Tout output vers l'adresse Ordinals doit avoir `value = DUST` (330 sats).
- Le change BTC (si nécessaire) va vers l'adresse Payment.

### Hunt simple (sans envoi de BTC ou Zeld)

- **Input :** Choisir le plus petit UTXO de l'adresse de payment ayant plus de `DUST + MIN_FEE_RESERVE` sats.
- **Outputs :**
  1. Adresse Ordinals, `value = DUST` (330 sats), `change = false`
  2. Adresse Payment, `value = null`, `change = true` (change BTC)
- **Target :** Valeur demandée par l'utilisateur.
- **Distribution :** Aucune.

### Hunt avec envoi de BTC

- **Inputs :** En commençant par le plus gros UTXO de l'adresse de payment, en prendre suffisamment pour couvrir `btc_output.amount + DUST + MIN_FEE_RESERVE`.
- **Outputs :**
  1. Adresse Ordinals, `value = DUST` (330 sats), `change = false`
  2. `btc_output.address` avec `btc_output.amount`, `change = false`
  3. Adresse Payment, `value = null`, `change = true` (change BTC)
- **Target :** Valeur demandée par l'utilisateur.
- **Distribution :** Aucune.

### Hunt avec envoi de Zeld

- **Inputs :**
  1. En partant du plus gros, choisir les UTXOs de l'adresse Ordinals nécessaires pour couvrir `zeld_output.amount`.
  2. Si le total BTC des inputs sélectionnés est inférieur à `2 * DUST + MIN_FEE_RESERVE`, ajouter des UTXOs supplémentaires (de l'adresse Ordinals ou de l'adresse Payment) pour atteindre ce seuil.
- **Outputs :**
  1. Adresse Ordinals, `value = DUST` (330 sats), `change = false` (change Zeld)
  2. `zeld_output.address`, `value = DUST` (330 sats), `change = false`
  3. Adresse Payment, `value = null`, `change = true` (change BTC, si nécessaire)
- **Target :** Valeur demandée par l'utilisateur.
- **Distribution :** `[change_zeld, zeld_output.amount]` où `change_zeld = total Zeld dans les inputs - zeld_output.amount`.

**Note :** Chaque algorithme doit avoir sa propre fonction dédiée pour plus de lisibilité. La fonction `prepareMinerArgs()` appelle la fonction adéquate selon le cas.

## Checklist Phase 2

- [ ] Lire la documentation de zeldhash-miner et la web-demo
- [ ] Implémenter `addressToScriptPubKey()` pour générer le scriptPubKey depuis l'adresse
- [ ] Créer la fonction `prepareSimpleHunt()` (sélection du plus petit UTXO viable)
- [ ] Créer la fonction `prepareBtcSendHunt()` (sélection greedy des plus gros UTXOs)
- [ ] Créer la fonction `prepareZeldSendHunt()` (sélection UTXOs Ordinals + compléments)
- [ ] Implémenter la fonction principale `prepareMinerArgs()` avec dispatch vers les helpers
- [ ] Gérer l'erreur `INSUFFICIENT_FUNDS` quand les UTXOs sont insuffisants
- [ ] Écrire les tests unitaires pour chaque cas de préparation

---

# Phase 3 : Intégration du miner

**Prérequis :** Avant de commencer cette phase, lire attentivement la documentation et l'exemple :
- `/Users/ouziel/Work/zeldhash/zeldhash-miner/facades/typescript/README.md`
- `/Users/ouziel/Work/zeldhash/zeldhash-miner/examples/web-demo`

**Instanciation du miner :**

```typescript
import { ZeldMiner } from "zeldhash-miner";

const miner = new ZeldMiner({
  network: "mainnet",
  useWebGPU: true,  // fallback auto vers CPU si indisponible
  satsPerVbyte: 12, // à adapter selon les conditions du mempool
});
```

Dans `startHunting()`, appeler `prepareMinerArgs()` puis `miner.mineTransaction()`.

**Affichage pendant le mining** (sur une même ligne, en dessous de la ligne contenant le bouton Hunt) :
- Vitesse en hash/seconde
- Nombre d'essais effectués
- Temps écoulé
- Bouton **Stop/Resume**

Le bouton Hunt doit être désactivé pendant le mining.

**Affichage à la fin du mining :**
- Le txid trouvé avec un message de félicitation
- Un bouton **« Sign and broadcast »**

**Action du bouton « Sign and broadcast » :**
- Le miner retourne un PSBT (Partially Signed Bitcoin Transaction) non signé.
- Appeler `signPsbt` du wallet connecté avec ce PSBT.
- Au retour, afficher un message de succès avec un lien vers `https://mempool.space/tx/<txid>`.

**Gestion des erreurs :**
- Toutes les erreurs remontées par le miner ou par la wallet lors de la signature doivent être affichées clairement à l'utilisateur.
- En cas d'erreur, permettre à l'utilisateur de réessayer.

## Checklist Phase 3

- [ ] Intégrer la dépendance zeldhash-miner dans le projet
- [ ] Connecter `startHunting()` à `prepareMinerArgs()` puis au miner
- [ ] Créer la ligne de stats (hash/s, essais, temps écoulé)
- [ ] Implémenter le bouton Stop/Resume avec gestion d'état
- [ ] Désactiver le bouton Hunt pendant le mining
- [ ] Afficher le txid trouvé avec message de félicitation
- [ ] Créer le bouton "Sign and broadcast"
- [ ] Implémenter l'appel à `signPsbt()` du wallet
- [ ] Afficher le lien mempool.space après broadcast réussi
- [ ] Implémenter la gestion d'erreurs avec messages utilisateur
- [ ] Ajouter la possibilité de réessayer après erreur
- [ ] Rafraîchir les balances après broadcast réussi
