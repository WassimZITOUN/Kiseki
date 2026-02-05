# Kiseki — Fonctionnement des Groupes et Votes

## Vue d'ensemble

L'application permet aux utilisateurs de creer ou rejoindre des groupes, puis de repondre chaque jour a une "Question du jour" en votant pour un membre du groupe. Les resultats sont reveles a une heure configurable.

---

## 1. Gestion des groupes

### 1.1 Liste des groupes

L'ecran principal affiche tous les groupes de l'utilisateur sous forme de cartes.

**Informations affichees par groupe :**
- Nom du groupe
- Nombre de membres
- Code d'invitation

**Actions disponibles :**
- Tirer vers le bas pour rafraichir la liste
- Appuyer sur un groupe → acces au detail
- Bouton "Creer" → creation d'un nouveau groupe
- Bouton "Rejoindre" → rejoindre un groupe existant

**Etat vide :** message "Aucun groupe" avec invitation a creer ou rejoindre un groupe.

---

### 1.2 Creer un groupe

L'utilisateur remplit un formulaire avec :
- **Nom du groupe** (obligatoire) — ex: "La bande du lycee"
- **Nombre max de membres** — par defaut 20

Apres creation, un ecran de confirmation affiche :
- Le code d'invitation a 8 caracteres (ex: A1B2C3D4)
- Un bouton pour copier le code dans le presse-papier
- Un bouton pour acceder au groupe

**Parametres par defaut du groupe :**
| Parametre | Valeur |
|-----------|--------|
| Membres max | 20 |
| Heure de la question | 12:00 |
| Heure du reveal | 20:00 |
| Intensites autorisees | normal |

---

### 1.3 Rejoindre un groupe

L'utilisateur saisit le code d'invitation a 8 caracteres (converti automatiquement en majuscules).

**Cas d'erreur geres :**
- Code invalide
- Groupe plein
- Deja membre du groupe

Apres succes, l'utilisateur est redirige vers le detail du groupe.

---

### 1.4 Detail du groupe

Cet ecran affiche toutes les informations du groupe :

- **Nom du groupe**
- **Code d'invitation** avec bouton "Copier"
- **Horaires** : heure de la question et heure du reveal
- **Bouton "Question du jour"** → acces a l'ecran de vote
- **Liste des membres** : avatar, nom, @username, badge "Admin" si applicable
- **Bouton "Quitter le groupe"** avec confirmation

---

## 2. Systeme de vote quotidien

### 2.1 Cycle quotidien

Chaque jour, le cycle suit ces etapes :

```
[question_time]     La question du jour est publiee (status: active)
       |
       v
  Les membres votent en choisissant un autre membre + commentaire optionnel
       |
       v
[reveal_time]       Les resultats sont reveles (status: revealed)
```

---

### 2.2 Ecran "Question du jour"

L'ecran s'adapte automatiquement selon l'etat :

#### Etat A — Pas de question aujourd'hui

Si aucune question n'a ete publiee pour aujourd'hui, un simple message s'affiche :
> "Pas de question aujourd'hui"

#### Etat B — Question active, pas encore vote

L'utilisateur voit :
1. **Le texte de la question** (centre, en gras)
2. **La liste des membres du groupe** (sauf soi-meme) — chaque membre est une carte cliquable
3. **Un champ commentaire optionnel** — max 140 caracteres, avec compteur en temps reel (le compteur passe en rouge a partir de 130 caracteres)
4. **Un bouton "Voter"** — desactive tant qu'aucun membre n'est selectionne

**Selection d'un membre :** la carte selectionnee passe en surbrillance bleue avec une coche.

#### Etat C — Question active, deja vote

L'utilisateur voit :
1. **Le texte de la question**
2. **Un message de confirmation** : "Tu as vote !" dans un encadre vert
3. **Le resume du vote** : nom du membre choisi + commentaire (si renseigne)
4. **Un compte a rebours** au format HH:MM:SS indiquant le temps restant avant le reveal
5. **Un bouton "Modifier mon vote"** — permet de revenir au formulaire pour changer son choix

Le compte a rebours se met a jour chaque seconde et s'arrete a 00:00:00.

#### Etat D — Resultats reveles

Un message simple s'affiche :
> "Resultats disponibles"

*(L'ecran de resultats detailles sera implemente dans une future mise a jour.)*

---

### 2.3 Modifier son vote

Tant que la question est active (avant le reveal), l'utilisateur peut modifier son vote :
- Appuyer sur "Modifier mon vote" dans l'ecran de confirmation
- Le formulaire de vote reapparait pre-rempli avec le choix precedent
- L'utilisateur peut changer le membre cible et/ou le commentaire
- Bouton "Annuler" pour revenir a la confirmation sans modifier

---

### 2.4 Regles de vote

| Regle | Detail |
|-------|--------|
| Qui peut voter | Tout membre du groupe |
| Pour qui voter | N'importe quel autre membre (sauf soi-meme) |
| Combien de votes | 1 seul vote par question par personne |
| Modification | Possible tant que la question est active |
| Commentaire | Optionnel, maximum 140 caracteres |
| Anonymat | Les votes ne sont visibles qu'apres le reveal (sauf son propre vote) |

---

## 3. Navigation

```
Liste des groupes
  ├── Creer un groupe → Detail du groupe
  ├── Rejoindre un groupe → Detail du groupe
  └── [Tap sur un groupe] → Detail du groupe
                               └── Question du jour
                                     ├── Voter
                                     ├── Voir confirmation + timer
                                     └── Modifier son vote
```

---

## 4. Points a noter pour amelioration

- L'ecran de **resultats detailles** n'est pas encore implemente (affiche seulement "Resultats disponibles")
- Les **parametres du groupe** (heure question, heure reveal, intensites) ne sont pas modifiables depuis l'interface — ils utilisent les valeurs par defaut
- Il n'y a pas de **notifications push** pour prevenir les utilisateurs quand la question est publiee ou quand les resultats sont reveles
- Le **recap hebdomadaire** (types definis dans le code) n'est pas encore implemente
- Pas de **systeme d'administration** visible : un admin ne peut pas encore publier de questions manuellement depuis l'app
- Le **widget** (type defini) n'est pas encore implemente
