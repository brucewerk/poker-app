# 🔧 Correções de Erros de API (Failed to fetch)

## 📋 Problemas Identificados

Os erros "Failed to fetch" estão ocorrendo nas seguintes rotas:
1. `/api/update-stats` - Atualização de estatísticas
2. `/api/get-level` - Busca de nível do usuário
3. `/api/public/get-chips` - Busca de fichas do usuário

## 🔧 Correções Aplicadas

### 1. **Timeout nas Conexões com Banco de Dados**
Adicionado timeout de 10 segundos nas conexões MongoDB para evitar travamentos:

**Arquivos Corrigidos:**
- `app/api/update-stats/route.js`
- `app/api/public/get-chips/route.js`
- `app/api/get-level/route.js`

**Exemplo de Correção:**
```javascript
// Antes:
await dbConnect();

// Depois:
await Promise.race([
  dbConnect(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout na conexão com banco de dados')), 10000)
  )
]);
```

### 2. **Timeout nas Requisições Fetch do Cliente**
Adicionado AbortController com timeout de 10-15 segundos nas requisições fetch:

**Arquivos Corrigidos:**
- `app/page.jsx` (funções `updateStats` e `fetchChipsFromDB`)
- `components/Poker/LevelDisplay.jsx` (função `fetchLevelData`)

**Exemplo de Correção:**
```javascript
// Antes:
const res = await fetch("/api/update-stats", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ /* ... */ }),
});

// Depois:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);

const res = await fetch("/api/update-stats", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ /* ... */ }),
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

### 3. **Melhor Error Handling**
Adicionado verificação de resposta e tratamento específico de erros:

```javascript
if (!res.ok) {
  console.error("❌ Erro na resposta da API:", res.status, res.statusText);
  return null;
}
```

## 🚨 Causa Raiz Provável

Os erros "Failed to fetch" geralmente indicam:

1. **Problema de Conexão MongoDB:**
   - A variável `MONGODB_URI` não está configurada no `.env.local`
   - O servidor MongoDB não está acessível
   - A string de conexão está incorreta

2. **Problema de Rede:**
   - A aplicação está rodando em localhost com firewall bloqueando
   - Problemas de CORS (embora menos provável em Next.js)

3. **Timeout do Servidor:**
   - O servidor está demorando muito para responder
   - Conexões lentas com o banco de dados

## 🛠️ Como Resolver

### Passo 1: Verificar Configuração do MongoDB

Certifique-se de que o arquivo `.env.local` existe e contém:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Passo 2: Verificar Conexão com MongoDB

Teste a conexão executando:

```bash
# Verificar se o MongoDB está acessível
node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('✅ Conexão OK')).catch(e => console.error('❌ Erro:', e))"
```

### Passo 3: Verificar logs do servidor

Se estiver usando Next.js, verifique os logs do console do servidor para erros de conexão MongoDB.

### Passo 4: Testar API Manualmente

Teste as rotas manualmente:

```bash
# Testar get-chips
curl -X POST http://localhost:3000/api/public/get-chips \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario"}'

# Testar get-level
curl "http://localhost:3000/api/get-level?username=seu_usuario"

# Testar update-stats
curl -X POST http://localhost:3000/api/update-stats \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","result":"win","chips":100,"handName":"Um Par"}'
```

## 🔄 Fallback Implementado

As correções incluem tratamento de erro graceful:

1. **Se falhar buscar fichas:** Retorna valor padrão de 1000 fichas
2. **Se falhar buscar nível:** Mostra mensagem de erro na UI
3. **Se falhar atualizar stats:** Não interrompe o fluxo do jogo

## 🎯 Próximos Passos

1. **Configurar MongoDB corretamente** se ainda não estiver
2. **Testar as rotas manualmente** para confirmar funcionamento
3. **Monitorar logs** para identificar outros problemas
4. **Considerar cache local** para reduzir dependência de API em certos casos

## 📝 Notas Importantes

- As correções de timeout são preventivas e não resolvem problemas de conexão base
- Se o MongoDB não estiver configurado, o jogo ainda funcionará com valores padrão
- Os erros de fetch agora são logados de forma mais detalhada para facilitar debug
- O jogo não deve travar completamente mesmo se a API falhar