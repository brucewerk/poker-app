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

## Próximos passos sugeridos (não incluídos nesta passagem, para não
arriscar regressão num pacote só)

- Aplicar o mesmo componente `Card` real dentro de `OnlineGame.jsx` e
  `TournamentGame.jsx` (hoje eles ainda desenham cartas com um
  `<span>` simples via `CardDisplay`/`cardStyle`), unificando o visual
  também no multiplayer online e nos torneios.
- Adicionar sons já existentes (`lib/sound.js`) ao evento de confetti
  (ex.: `soundManager.playWinSequence()` já é chamado em `page.jsx`,
  então o áudio e o confetti agora tocam juntos automaticamente).
- Avatar/moldura de assento com o dealer button (⚪ "D") girando entre
  jogadores no multiplayer, usando o mesmo esquema de cores do tema.
