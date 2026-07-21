# 🃏 Poker App - Texas Hold'em vs CPU

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat&logo=socket.io)](https://socket.io/)

> Um jogo de poker Texas Hold'em completo e imersivo, desenvolvido com Next.js 14, onde você enfrenta uma CPU inteligente em partidas emocionantes.

---

## ✨ Visão Geral

**Poker App** é uma aplicação web moderna que simula uma experiência completa de poker Texas Hold'em contra uma CPU. O projeto combina um frontend interativo com um backend robusto, oferecendo funcionalidades como:

- 🤖 **CPU Inteligente**: Decisões baseadas em força de mão e análise de contexto
- 👤 **Sistema de Usuários**: Autenticação completa com NextAuth.js
- 🏆 **Progressão**: Sistema de níveis, XP, conquistas e missões diárias
- 🎮 **Multiplayer**: Suporte para partidas locais e online com Socket.io
- 📊 **Estatísticas Detalhadas**: Acompanhamento de desempenho e histórico
- 🎨 **UI/UX Imersiva**: Interface moderna e responsiva com feedbacks sonoros

---

## 🚀 Tecnologias Utilizadas

| Tecnologia      | Versão | Propósito                               |
| --------------- | ------ | --------------------------------------- |
| **Next.js**     | 16.2.9 | Framework React com App Router          |
| **React**       | 19.x   | Biblioteca para construção de UI        |
| **MongoDB**     | -      | Banco de dados NoSQL                    |
| **Mongoose**    | -      | ODM para MongoDB                        |
| **NextAuth.js** | -      | Autenticação de usuários                |
| **Socket.io**   | -      | Comunicação em tempo real (multiplayer) |
| **bcryptjs**    | -      | Hash de senhas                          |

---

## 📂 Estrutura do Projeto

poker-app/<br>
├── app/ # 📱 App Router (Next.js 14)<br>
│ ├── page.jsx # 🃏 Página principal do jogo<br>
│ ├── login/page.jsx # 🔐 Página de login<br>
│ ├── register/page.jsx # 📝 Página de registro<br>
│ └── api/ # 🔌 API Routes (12 rotas)<br>
│ ├── auth/ # Autenticação<br>
│ ├── missions/ # Missões diárias<br>
│ ├── get-level/ # Nível do usuário<br>
│ ├── get-stats/ # Estatísticas<br>
│ ├── update-stats/ # Atualizar estatísticas<br>
│ ├── save-game-state/ # Salvar estado do jogo<br>
│ ├── get-game-state/ # Recuperar estado salvo<br>
│ ├── save-hand-history/ # Salvar histórico<br>
│ ├── get-hand-history/ # Buscar histórico<br>
│ ├── save-chips/ # Salvar fichas<br>
│ └── friends/ # Gerenciar amigos<br>
│<br>
├── components/Poker/ # 🎨 Componentes React (18)<br>
│ ├── Card.jsx # Carta individual<br>
│ ├── ActionButtons.jsx # Botões de ação<br>
│ ├── StatusPanel.jsx # Status da partida<br>
│ ├── StatsPanel.jsx # Estatísticas do jogador<br>
│ ├── LevelDisplay.jsx # Nível e progresso<br>
│ ├── AchievementsModal.jsx # Conquistas<br>
│ ├── FindingsModal.jsx # Achados<br>
│ ├── MissionsPanel.jsx # Missões diárias<br>
│ ├── HandHistory.jsx # Histórico de partidas<br>
│ ├── FriendsList.jsx # Lista de amigos<br>
│ ├── SoundToggle.jsx # Controle de som<br>
│ ├── TurboButton.jsx # Modo turbo<br>
│ ├── OnlineLobby.jsx # Lobby multiplayer<br>
│ └── MultiplayerModal.jsx # Modal multiplayer<br>
│<br>
├── lib/ # 📚 Bibliotecas e utilitários<br>
│ ├── mongoose.js # Conexão com MongoDB<br>
│ ├── sound.js # Gerenciador de sons<br>
│ ├── level.js # Sistema de nível e XP<br>
│ ├── achievements.js # Definição de conquistas<br>
│ ├── findings.js # Definição de achados<br>
│ └── poker/ # 🃏 Lógica do poker<br>
│ ├── deck.js # Baralho<br>
│ ├── evaluation.js # Avaliação de mãos<br>
│ ├── strength.js # Força da mão<br>
│ └── cpu.js # Decisões da CPU<br>
│<br>
├── models/ # 📊 Modelos MongoDB<br>
│ └── User.js # Schema do usuário<br>
│<br>
├── public/ # 🖼️ Arquivos estáticos<br>
├── server.js # Servidor HTTP<br>
└── socket-server.js # Servidor Socket.io<br>

---

## 🔥 Fluxo da Aplicação

    A[Login/Registro] --> B[Página Principal]
    B --> C[Recuperar Estado Salvo]
    C --> D[Iniciar Nova Mão]
    D --> E[Jogador Decide]
    E --> F{Fold, Call, Raise, All-in?}
    F --> G[CPU Responde]
    G --> H[Showdown]
    H --> I[Atualizar Estatísticas]
    I --> J[Salvar Histórico]
    J --> K[Salvar Fichas]
    K --> L[Nova Mão ou Fim]
    L --> D

🛠️ Como Executar<br>
Pré-requisitos: Node.js (v18.17 ou superior) / MongoDB Atlas ou instância local

Passos:

- Clone o repositório

<code>bash
git clone https://github.com/brucewerk/poker-app.git
cd poker-app</code>

- Instale as dependências:
  <code>bash
  npm install</code>

# ou yarn, pnpm, bun

- Configure as variáveis de ambiente:<br>
  Crie um arquivo .env.local:<br>
  <code>env
  MONGODB_URI=sua_uri_mongodb
  NEXTAUTH_SECRET=seu_secret
  NEXTAUTH_URL=http://localhost:3000</code>

Execute o servidor de desenvolvimento:<br>
<code>bash
npm run dev</code>

# ou yarn dev, pnpm dev, bun dev

- Acesse o jogo:<br>
  Abra http://localhost:3000

<br>
🎮 Funcionalidades Principais:<br>

🃏 Jogo de Poker Texas Hold'em completo contra CPU

Decisões inteligentes da CPU baseadas em força de mão

Modo Turbo para partidas rápidas

Sistema de som imersivo

👤 Sistema de Usuário:<br>

Registro e login com NextAuth.js

Perfil persistente com MongoDB

Progressão com XP e níveis

Conquistas e achados colecionáveis

📊 Estatísticas e Progresso:<br>

Histórico completo de partidas

Estatísticas detalhadas (mãos jogadas, vitórias, streaks)

Sistema de níveis com recompensas

Missões diárias

👥 Multiplayer:<br>

Partidas locais com amigos

Jogo online via Socket.io

Salas e lobby para partidas

🗄️ Modelo de Dados (MongoDB):<br>
<code>javascript
{
username: String,
password: String, // Hash bcrypt
chips: Number,
level: Number,
xp: Number,
stats: {
handsPlayed: Number,
handsWon: Number,
totalChipsWon: Number,
biggestWin: Number,
bestStreak: Number,
bestHand: String,
allInWins: Number,
currentStreak: Number
},
achievements: [String],
findings: [Object],
missions: [Object],
handHistory: [Object],
friends: [Object],
savedGameState: Object,
createdAt: Date,
updatedAt: Date
}
</code>

📚 Aprenda Mais:<br>
Documentação do Next.js

Tutorial Interativo do Next.js

Repositório do Next.js

Documentação do MongoDB

NextAuth.js

🚀 Deploy:<br>
Deploy na Vercel (Recomendado)

https://vercel.com/button

Deploy no Render.com

O projeto inclui configuração para deploy no Render.com com suporte a Socket.io. Consulte o arquivo render.yaml para mais detalhes.

🤝 Contribuição:<br>
Contribuições são sempre bem-vindas! Sinta-se à vontade para:

Fazer um Fork do projeto

Criar uma Branch para sua feature (git checkout -b feature/AmazingFeature)

Fazer Commit das mudanças (git commit -m 'Add some AmazingFeature')

Fazer Push para a Branch (git push origin feature/AmazingFeature)

Abrir um Pull Request

📄 Licença:<br>
Distribuído sob a licença MIT. Veja LICENSE para mais informações.

🙏 Agradecimentos:<br>
Vercel pela plataforma incrível

Comunidade Next.js e React

MongoDB pelo banco de dados

Todos os contribuidores e usuários do projeto

📊 Status do Projeto:<br>
✅ Autenticação completa

✅ Lógica de poker funcional

✅ Sistema de progressão

✅ Multiplayer local e online

✅ Interface responsiva

✅ Efeitos sonoros

✅ Banco de dados persistente

<div align="center"> <strong>⭐ Feito com ❤️ usando Next.js ⭐</strong> <br> <sub>Disponível em: <a href="https://poker-chi-neon.vercel.app">poker-chi-neon.vercel.app</a></sub> </div> ```
