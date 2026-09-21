# 🎨 Poker by BruCe — Reformulação Visual v2

## O que foi feito nesta passagem

1. **`components/Poker/Card.jsx` — cartas totalmente redesenhadas**
   - Naipes agora são ícones SVG nítidos (não mais emoji), com cor vermelha real
     para ♥/♦ e cor escura para ♠/♣.
   - Índices de canto (rank + naipe) no padrão de baralho real, inclusive
     invertidos no canto inferior direito.
   - Pips posicionados corretamente para todas as cartas numéricas (2 a 10),
     Ases com naipe grande central, e J/Q/K com naipe + letra estilizada.
   - Verso da carta com padrão de losangos dourados e brilho, diferente por tema.
   - Animação de flip 3D (rotateY) ao revelar cartas viradas, brilho pulsante
     em cartas vencedoras (`isHighlighted`), leve "lift" ao passar o mouse.
   - **API 100% compatível** com o componente antigo (mesmas props:
     `card`, `faceDown`, `delay`, `size`, `isHighlighted`, `isRevealing`),
     então todos os lugares que já usavam `<Card />` (GameTable, etc.)
     continuam funcionando sem nenhuma alteração.

2. **`components/Poker/ResultModal.jsx` — modal de resultado premium**
   - Passou a usar o novo componente `Card` real (em vez de um mini-card
     duplicado e mais simples).
   - **Confetti de comemoração** em vitórias, usando a dependência
     `react-confetti` que já estava no `package.json` mas nunca era usada.
     Vitórias grandes (≥300 fichas) ganham um confetti maior e dourado, e
     o título muda para "GRANDE VITÓRIA!".
   - Badges "VENCEDOR" / "ELIMINADO" / "EMPATE" ao lado dos nomes.
   - Pequenas animações de entrada (ícone balançando, valor do pote
     "pulsando") para reforçar o clima de vitória/derrota.
   - Mantém 100% da lógica original (fechamento, bloqueio de scroll,
     modo compacto para telas baixas, etc.).

3. **`app/globals.css` — polimento aditivo (nada removido)**
   - Brilho ambiente suave e pulsante ao redor da mesa.
   - Scrollbars finas e douradas nos painéis internos.
   - `perspective` nas fileiras de cartas para o flip 3D funcionar bem.
   - Confetti sempre por cima de tudo e sem bloquear cliques.

## Por que essas mudanças e não outras

O app já tinha uma arquitetura sólida (Next.js + MongoDB + Socket.IO,
sistema de níveis/conquistas/missões, multiplayer local/online, torneios,
CPU com estratégia razoável). O ponto fraco visual real eram as **cartas**
(emoji genérico) e o **momento de clímax** (resultado da mão sem nenhuma
celebração, apesar de já ter `react-confetti` instalado e nunca usado).
Resolver esses dois pontos dá o maior "salto" de sensação de jogo moderno
e animado com o menor risco de regressão, porque:

- Nada de lógica de jogo (poker/CPU/sockets/mongo/auth) foi tocado.
- As props e o comportamento externo dos componentes alterados são os
  mesmos de antes — apenas o visual interno mudou.
- CSS só recebeu adições no final do arquivo; nenhuma regra existente
  foi removida ou substituída.

## Como aplicar

Basta **substituir os arquivos** abaixo pelos do zip (mesmo caminho),
sem nenhum passo extra de migração de banco de dados ou variáveis de
ambiente:

- `components/Poker/Card.jsx`
- `components/Poker/ResultModal.jsx`
- `app/globals.css`

Como o `react-confetti` já está em `package.json`, um `npm install`
normal (o mesmo que você já roda) é suficiente — não é preciso instalar
nada novo manualmente.

## v2.1 — segunda passagem de melhorias (continuação)

4. **`components/Poker/TournamentGame.jsx` — cartas reais no torneio**
   - As cartas dos jogadores e as cartas comunitárias do modo Torneio
     agora usam o mesmo componente `Card` real (SVG, pips, flip),
     em vez do antigo `<span>{card.rank}{card.suit}</span>` genérico.
   - Assinatura das funções internas (`renderCards`) mantida — só o
     conteúdo visual mudou, nenhuma prop pública do componente foi
     alterada.
   - As funções de estilo antigas (`cardStyle`/`cardPlaceholderStyle`)
     foram deixadas no arquivo (a de placeholder ainda é usada quando
     não há cartas); nada foi removido, só deixou de ser chamado onde
     não fazia mais sentido — zero risco de regressão.

5. **`components/Poker/OnlineGame.jsx` — confirmado usando cartas reais**
   - Esse arquivo já usa um wrapper `CardDisplay` sobre o componente
     `Card` real (naipes SVG/pips/flip) para as cartas do multiplayer
     online — validado e mantido como está, sem necessidade de mudança.

6. **`components/Poker/ActionButtons.jsx` — indicador visual de "sua vez"**
   - A grade de botões de ação (Fold/Call/Raise/All-in/Nova Mão) agora
     ganha um **brilho dourado pulsante** ao redor enquanto é a vez do
     jogador agir (`isGameActive === true`), usando `framer-motion`.
   - O brilho desliga automaticamente assim que o jogador age, a mão
     termina, ou é a vez da CPU — reaproveitando a mesma variável
     `isGameActive` que já controlava o `disabled` dos botões, então
     não há nenhuma lógica nova de estado, só uma animação condicional.
   - Ajuda bastante a comunicar visualmente "é sua vez de jogar" sem
     precisar ler o texto do `StatusPanel`.

## Próximos passos sugeridos (não incluídos ainda, para não arriscar
regressão num pacote só)

- Dealer button (⚪ "D") girando entre assentos no modo 2 Jogadores /
  Torneio, usando o `currentPlayerIndex`/`dealerIndex` que o backend
  já calcula.
- Reaproveitar o mesmo brilho pulsante de "sua vez" também nos botões
  de ação do `OnlineGame.jsx` e do `TournamentGame.jsx` (hoje eles têm
  seus próprios botões de ação simples, sem esse destaque).
- Avatares/iniciais coloridas para os jogadores no `PlayerSelector` e
  nas listas de sala (`RoomList`, `OnlineLobby`), no lugar do nome puro.
