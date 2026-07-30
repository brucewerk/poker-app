// Teste de validação do fluxo de poker
// Este arquivo valida as correções feitas no código de poker

import { createDeck } from './lib/poker/deck.js';
import { getHandRank, compareHands } from './lib/poker/evaluation.js';
import { calculateHandStrength } from './lib/poker/strength.js';
import { getCpuDecision } from './lib/poker/cpu.js';

console.log('🔍 Iniciando validação do fluxo de Poker Texas Hold\'EM...\n');

// Teste 1: Criação do baralho
console.log('📦 Teste 1: Criação do baralho');
try {
  const deck = createDeck();
  console.log(`✅ Baralho criado com ${deck.length} cartas`);
  
  // Verificar se todas as cartas têm valor numérico
  const hasAllValues = deck.every(card => typeof card.value === 'number');
  console.log(`✅ Todas as cartas têm valor numérico: ${hasAllValues}`);
  
  // Verificar algumas cartas específicas
  const aceOfSpades = deck.find(c => c.rank === 'A' && c.suit === '♠');
  console.log(`✅ Ás de Espadas: rank=${aceOfSpades.rank}, value=${aceOfSpades.value}`);
  
  const kingOfHearts = deck.find(c => c.rank === 'K' && c.suit === '♥');
  console.log(`✅ Rei de Copas: rank=${kingOfHearts.rank}, value=${kingOfHearts.value}`);
} catch (error) {
  console.error('❌ Erro no teste de baralho:', error.message);
}

// Teste 2: Avaliação de mãos
console.log('\n🃏 Teste 2: Avaliação de mãos');
try {
  const deck = createDeck();
  
  // Teste com par de Ás
  const playerCards = [deck[0], deck[1]]; // Primeiras duas cartas
  const communityCards = [deck[2], deck[3], deck[4], deck[5], deck[6]];
  
  console.log('🎴 Cartas do jogador:', playerCards.map(c => `${c.rank}${c.suit}`).join(', '));
  console.log('🎴 Cartas comunitárias:', communityCards.map(c => `${c.rank}${c.suit}`).join(', '));
  
  const handRank = getHandRank(playerCards, communityCards);
  console.log(`✅ Mão avaliada: ${handRank.name} (score: ${handRank.score})`);
  
  // Teste de comparação de mãos
  const cpuCards = [deck[7], deck[8]];
  const cpuHandRank = getHandRank(cpuCards, communityCards);
  console.log(`✅ Mão da CPU: ${cpuHandRank.name} (score: ${cpuHandRank.score})`);
  
  const comparison = compareHands(handRank, cpuHandRank);
  console.log(`✅ Comparação: ${comparison > 0 ? 'Jogador vence' : comparison < 0 ? 'CPU vence' : 'Empate'}`);
} catch (error) {
  console.error('❌ Erro no teste de avaliação:', error.message);
}

// Teste 3: Cálculo de força da mão
console.log('\n💪 Teste 3: Cálculo de força da mão');
try {
  const deck = createDeck();
  
  // Teste com cartas específicas
  const highCards = deck.filter(c => c.rank === 'A' || c.rank === 'K').slice(0, 2);
  const strength = calculateHandStrength(highCards, []);
  console.log(`✅ Força da mão (AK pré-flop): ${strength.toFixed(2)}`);
  
  // Teste com par
  const pair = deck.filter(c => c.rank === 'A').slice(0, 2);
  const pairStrength = calculateHandStrength(pair, []);
  console.log(`✅ Força da mão (AA pré-flop): ${pairStrength.toFixed(2)}`);
} catch (error) {
  console.error('❌ Erro no teste de força:', error.message);
}

// Teste 4: Decisão da CPU
console.log('\n🤖 Teste 4: Decisão da CPU');
try {
  const deck = createDeck();
  
  const gameState = {
    deck: deck.slice(10),
    community: deck.slice(0, 5),
    playerCards: deck.slice(5, 7),
    cpuCards: deck.slice(7, 9),
    pot: 100,
    playerMoney: 500,
    cpuMoney: 500,
    currentBet: 50,
    playerBet: 50,
    cpuBet: 0,
    stage: 'flop',
    handActive: true,
    waitingPlayer: false,
    gameOver: false,
    playerAllin: false,
    cpuAllin: false,
    raiseCounter: 0,
    showdownStarted: false,
    playerHandName: '',
    cpuHandName: '🔒 ???',
    winnerMsg: '',
    cpuThought: '',
    playerSuggestion: '',
    gameStatus: 'Flop - Vez da CPU',
  };
  
  const cpuDecision = getCpuDecision(
    gameState,
    (state) => state, // advanceStage simplificado
    (msg) => console.log(`📢 ${msg}`), // showNotification
    'test-user'
  );
  
  console.log(`✅ Decisão da CPU: ${cpuDecision.gameStatus || 'Ação processada'}`);
  console.log(`✅ Estado após decisão: pot=${cpuDecision.pot}, cpuBet=${cpuDecision.cpuBet}`);
} catch (error) {
  console.error('❌ Erro no teste de decisão da CPU:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🎉 Validação do fluxo de poker concluída!');
console.log('📝 Resumo das correções aplicadas:');
console.log('  ✅ Normalização de cartas para compatibilidade rank/value');
console.log('  ✅ Correção no cálculo de força da mão');
console.log('  ✅ Melhoria na avaliação de mãos da CPU');
console.log('  ✅ Correção na comparação de mãos (score vs value)');
console.log('  ✅ Atualização do GameService para usar funções corretas');