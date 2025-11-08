# 🔍 Debug Passo a Passo - Cálculo de Preço

## 📋 Problema Atual

O erro `❌ Não foi possível calcular distância` ainda está ocorrendo na linha 1740 do `dashboard.js`.

---

## 🧪 Teste 1: Página de Teste Isolada

### **PASSO 1:** Abra o arquivo de teste

1. Abra o arquivo **`teste-calculo.html`** no navegador
2. Pressione **F12** para abrir o Console
3. Limpe o console (clique no ícone 🚫 ou pressione Ctrl+L)

### **PASSO 2:** Preencha os dados

```
Origem:
- Tipo: Rodoviária
- Cidade: São Paulo
- Estado: SP

Destino:
- Tipo: Rodoviária
- Cidade: Rio de Janeiro
- Estado: RJ
```

### **PASSO 3:** Clique em "Calcular Preço"

### **PASSO 4:** Copie TODOS os logs do console

Procure especialmente por:
- ❌ Erros em vermelho
- ⚠️ Avisos em amarelo
- As mensagens específicas sobre coordenadas e distância

**Cole os logs aqui ou me envie.**

---

## 🧪 Teste 2: Teste Manual no Console

### **PASSO 1:** Abra o Dashboard

1. Faça login no sistema
2. Vá para a página **"Solicitar Viagem"**
3. Abra o Console (F12)

### **PASSO 2:** Cole este código no console

```javascript
// Testar a classe PriceCalculator diretamente
console.clear();
console.log('🧪 INICIANDO TESTE MANUAL');

// Criar instância
const testCalc = new PriceCalculator();
console.log('✅ PriceCalculator criado');

// Testar busca de coordenadas
console.log('\n📍 TESTE 1: Buscar coordenadas de São Paulo');
testCalc.getBusStationCoords('São Paulo', 'SP').then(coords => {
  console.log('Resultado:', coords);
  
  if (coords) {
    console.log('\n📍 TESTE 2: Buscar coordenadas do Rio de Janeiro');
    testCalc.getBusStationCoords('Rio de Janeiro', 'RJ').then(coords2 => {
      console.log('Resultado:', coords2);
      
      if (coords2) {
        console.log('\n📏 TESTE 3: Calcular distância');
        testCalc.calculateDistance(coords, coords2).then(distance => {
          console.log('Distância calculada:', distance, 'km');
          
          if (distance) {
            const price = testCalc.calculatePrice(distance);
            console.log('💰 Preço calculado: R$', testCalc.formatCurrency(price));
            console.log('\n✅ TODOS OS TESTES PASSARAM!');
          } else {
            console.error('❌ FALHOU: Distância retornou null');
          }
        });
      } else {
        console.error('❌ FALHOU: Não encontrou coordenadas do Rio');
      }
    });
  } else {
    console.error('❌ FALHOU: Não encontrou coordenadas de São Paulo');
  }
});
```

### **PASSO 3:** Aguarde os resultados

O teste vai executar em sequência e mostrar exatamente onde está falhando.

### **PASSO 4:** Copie os resultados

Cole aqui os resultados completos do teste.

---

## 🧪 Teste 3: Verificar se os campos estão corretos

### **PASSO 1:** No Dashboard, abra o Console (F12)

### **PASSO 2:** Cole este código

```javascript
// Verificar se os campos existem
console.clear();
console.log('🔍 VERIFICANDO CAMPOS DO FORMULÁRIO\n');

const campos = {
  'origem-cidade': document.getElementById('origem-cidade'),
  'origem-estado': document.getElementById('origem-estado'),
  'origem-endereco': document.getElementById('origem-endereco'),
  'destino-cidade': document.getElementById('destino-cidade'),
  'destino-estado': document.getElementById('destino-estado'),
  'destino-endereco': document.getElementById('destino-endereco')
};

Object.keys(campos).forEach(id => {
  const campo = campos[id];
  if (campo) {
    console.log(`✅ ${id} existe`);
    console.log(`   Valor atual: "${campo.value}"`);
    console.log(`   Tipo: ${campo.tagName}`);
  } else {
    console.error(`❌ ${id} NÃO ENCONTRADO!`);
  }
});

// Verificar radios
console.log('\n📻 VERIFICANDO RADIOS\n');

const origemTipo = document.querySelector('input[name="origem_tipo"]:checked');
const destinoTipo = document.querySelector('input[name="destino_tipo"]:checked');

console.log('Origem tipo selecionado:', origemTipo ? origemTipo.value : 'NENHUM');
console.log('Destino tipo selecionado:', destinoTipo ? destinoTipo.value : 'NENHUM');

// Verificar se priceCalc existe
console.log('\n🧮 VERIFICANDO PRICE CALCULATOR\n');

if (typeof priceCalc !== 'undefined') {
  console.log('✅ priceCalc existe');
  console.log('   Status:', priceCalc);
} else {
  console.error('❌ priceCalc NÃO EXISTE!');
}

if (typeof PriceCalculator !== 'undefined') {
  console.log('✅ PriceCalculator classe existe');
} else {
  console.error('❌ PriceCalculator classe NÃO EXISTE!');
}
```

### **PASSO 3:** Cole os resultados aqui

---

## 🧪 Teste 4: Teste Simples de Haversine

### **PASSO 1:** Cole este código no Console

```javascript
// Testar o cálculo de Haversine diretamente
console.clear();
console.log('🧪 TESTE DIRETO DE HAVERSINE\n');

const calc = new PriceCalculator();

// Coordenadas conhecidas
const spCoords = { lat: '-23.5505', lon: '-46.6333' }; // São Paulo
const rjCoords = { lat: '-22.9068', lon: '-43.1729' }; // Rio de Janeiro

console.log('📍 Testando com coordenadas fixas:');
console.log('São Paulo:', spCoords);
console.log('Rio de Janeiro:', rjCoords);

const distance = calc.calculateDistanceHaversine(spCoords, rjCoords);

console.log('\n📏 Resultado:', distance, 'km');

if (distance && distance > 0) {
  console.log('✅ Haversine funcionou!');
  console.log('💰 Preço: R$', calc.formatCurrency(calc.calculatePrice(distance)));
} else {
  console.error('❌ Haversine falhou!');
}
```

---

## 🧪 Teste 5: Simular o Fluxo Completo

### **PASSO 1:** Preencha o formulário

1. Selecione "Rodoviária" em origem e destino
2. Preencha:
   - Origem: São Paulo, SP
   - Destino: Rio de Janeiro, RJ

### **PASSO 2:** Abra o Console ANTES de mudar o foco

### **PASSO 3:** Clique no campo "Destino - Estado"

### **PASSO 4:** Aguarde 1 segundo e veja os logs

Procure por:
```
⏱️ Agendando cálculo de preço em 1 segundo...
🚀 Disparando cálculo de preço
🧮 calculatePriceEstimate chamado
```

Se NÃO aparecer esses logs, significa que os event listeners não foram configurados corretamente.

---

## 📊 O Que Procurar nos Logs

### ✅ **Logs de Sucesso** (o que você DEVE ver):

```
🧮 Inicializando calculadora de preço...
✅ PriceCalculator criado com sucesso
📻 Encontrados 2 radios de origem e 2 radios de destino
✅ Campo encontrado: Origem Cidade (origem-cidade)
...
✅ Calculadora de preço inicializada com sucesso!

[Após preencher campos:]
⏱️ Agendando cálculo de preço em 1 segundo...
🚀 Disparando cálculo de preço
🧮 calculatePriceEstimate chamado
📍 Dados coletados: {...}
🔍 Buscando coordenadas de origem (rodoviaria)...
✅ Coordenadas de origem: {lat: ..., lon: ...}
🔍 Buscando coordenadas de destino (rodoviaria)...
✅ Coordenadas de destino: {lat: ..., lon: ...}
🎯 calculateDistance chamado
📍 Coordenadas recebidas - Origem: {...}
📍 Coordenadas recebidas - Destino: {...}
🌐 Tentando calcular rota com OSRM...
✅ Rota calculada com sucesso via OSRM: XXX km
✅ Distância calculada: XXX km
💰 Preço calculado: R$ XXX
✅ Cálculo concluído com sucesso!
```

### ❌ **Logs de Erro** (problemas que podem ocorrer):

1. **`❌ PriceCalculator não foi carregado!`**
   - Problema: Script `price-calculator.js` não foi carregado
   - Solução: Verificar ordem dos scripts no HTML

2. **`❌ Coordenadas não fornecidas`** ou **`❌ Coordenadas incompletas`**
   - Problema: API Nominatim não encontrou o endereço
   - Solução: Usar endereços/cidades conhecidos

3. **`❌ Coordenadas inválidas para Haversine`**
   - Problema: Dados de coordenadas estão null ou inválidos
   - Solução: Verificar por que o geocoding falhou

4. **`❌ Falha total: nem OSRM nem Haversine funcionaram`**
   - Problema: Ambos os métodos falharam
   - Solução: Ver logs anteriores para identificar o erro específico

---

## 🆘 Próximos Passos

Depois de executar os testes acima:

1. **Cole TODOS os logs** do console aqui
2. **Informe qual teste falhou** (1, 2, 3, 4 ou 5)
3. **Tire prints** se necessário
4. **Descreva** exatamente o que você fez e o que aconteceu

Com essas informações, posso identificar exatamente onde está o problema! 🔍

---

**Data:** 06/11/2025  
**Versão:** 2.2 - Debug Ultra-Detalhado

