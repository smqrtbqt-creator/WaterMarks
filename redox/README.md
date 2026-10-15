# Station redox

Petit jeu de poste de conduite : faire circuler les électrons dans une usine de traitement de l’eau, puis passer le quiz.

L’application est servie sous `/redox/`, en local comme sur le serveur.

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

- Laboratoire : http://127.0.0.1:5174/redox/
- Quiz : http://127.0.0.1:5174/redox/quiz

Sur le serveur, les mêmes chemins sont publiés par WaterMarks, sans vhost supplémentaire :

- https://164.132.108.166/redox/
- https://164.132.108.166/redox/quiz

Le résultat de la construction est dans `static/redox/`. Un rechargement sur le quiz reçoit la même page.
