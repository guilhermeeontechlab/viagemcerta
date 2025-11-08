/**
 * PriceCalculator - Sistema de Cálculo de Preço por KM
 * Utiliza APIs gratuitas: Nominatim (geocoding) e OSRM (rotas)
 */

class PriceCalculator {
  constructor() {
    this.pricePerKm = 0.50; // R$ 0,50 por km
    this.originCoords = null;
    this.destCoords = null;
    this.isCalculating = false;
  }

  /**
   * Buscar coordenadas de rodoviária usando OpenStreetMap Nominatim
   * @param {string} city - Nome da cidade
   * @param {string} state - Sigla do estado
   * @returns {Promise<{lat: string, lon: string}|null>}
   */
  async getBusStationCoords(city, state) {
    try {
      const query = `rodoviária ${city} ${state} Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Viagem Certa Transport System'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar rodoviária');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      
      // Fallback: tentar buscar apenas a cidade
      return await this.getCityCenter(city, state);
    } catch (error) {
      console.error('Erro ao buscar coordenadas da rodoviária:', error);
      return null;
    }
  }

  /**
   * Buscar centro da cidade caso rodoviária não seja encontrada
   * @param {string} city - Nome da cidade
   * @param {string} state - Sigla do estado
   * @returns {Promise<{lat: string, lon: string}|null>}
   */
  async getCityCenter(city, state) {
    try {
      const query = `${city} ${state} Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Viagem Certa Transport System'
        }
      });
      
      const data = await response.json();
      
      if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar coordenadas da cidade:', error);
      return null;
    }
  }

  /**
   * Buscar coordenadas de endereço completo
   * @param {string} address - Endereço completo
   * @param {string} city - Nome da cidade
   * @param {string} state - Sigla do estado
   * @returns {Promise<{lat: string, lon: string}|null>}
   */
  async getAddressCoords(address, city, state) {
    try {
      const fullAddress = `${address}, ${city}, ${state}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Viagem Certa Transport System'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
      }
      
      // Fallback: tentar buscar apenas cidade
      const simplifiedAddress = `${city}, ${state}, Brasil`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplifiedAddress)}&format=json&limit=1`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Viagem Certa Transport System'
        }
      });
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.length > 0) {
        return { lat: fallbackData[0].lat, lon: fallbackData[0].lon };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar coordenadas do endereço:', error);
      return null;
    }
  }

  /**
   * Calcular distância usando OSRM (Open Source Routing Machine)
   * Com fallback para cálculo de distância em linha reta (Haversine)
   * @param {{lat: string, lon: string}} origin - Coordenadas de origem
   * @param {{lat: string, lon: string}} dest - Coordenadas de destino
   * @returns {Promise<number|null>} Distância em km
   */
  async calculateDistance(origin, dest) {
    console.log('🎯 calculateDistance chamado');
    console.log('📍 Coordenadas recebidas - Origem:', origin);
    console.log('📍 Coordenadas recebidas - Destino:', dest);
    
    // Validar coordenadas antes de tudo
    if (!origin || !dest) {
      console.error('❌ Coordenadas não fornecidas');
      return null;
    }
    
    if (!origin.lat || !origin.lon || !dest.lat || !dest.lon) {
      console.error('❌ Coordenadas incompletas');
      console.error('Origem:', origin);
      console.error('Destino:', dest);
      return null;
    }
    
    // Tentar OSRM primeiro
    try {
      console.log('🌐 Tentando calcular rota com OSRM...');
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`;
      
      console.log('🔗 URL OSRM:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Resposta OSRM status:', response.status);
      
      if (!response.ok) {
        throw new Error(`OSRM retornou status ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📊 Dados OSRM:', JSON.stringify(data, null, 2));
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Converter metros para km e arredondar para 2 casas decimais
        const distanceKm = Math.round((data.routes[0].distance / 1000) * 100) / 100;
        console.log('✅ Rota calculada com sucesso via OSRM:', distanceKm, 'km');
        return distanceKm;
      }
      
      console.warn('⚠️ OSRM não retornou rota válida');
      console.warn('Code:', data.code);
      console.warn('Tentando fallback...');
      
    } catch (error) {
      console.error('❌ Erro ao calcular distância com OSRM:', error.message);
      console.log('🔄 Usando cálculo de distância em linha reta (fallback)...');
    }
    
    // Fallback: calcular distância em linha reta
    const fallbackDistance = this.calculateDistanceHaversine(origin, dest);
    
    if (fallbackDistance && fallbackDistance > 0) {
      console.log('✅ Distância calculada via fallback (Haversine):', fallbackDistance, 'km');
      return fallbackDistance;
    }
    
    console.error('❌ Falha total: nem OSRM nem Haversine funcionaram');
    return null;
  }

  /**
   * Calcular distância em linha reta usando fórmula de Haversine
   * @param {{lat: string, lon: string}} origin - Coordenadas de origem
   * @param {{lat: string, lon: string}} dest - Coordenadas de destino
   * @returns {number} Distância em km
   */
  calculateDistanceHaversine(origin, dest) {
    try {
      console.log('🧮 Iniciando cálculo Haversine...');
      console.log('📍 Origem:', origin);
      console.log('📍 Destino:', dest);
      
      // Validar coordenadas
      if (!origin || !dest || !origin.lat || !origin.lon || !dest.lat || !dest.lon) {
        console.error('❌ Coordenadas inválidas para Haversine');
        return null;
      }
      
      const R = 6371; // Raio da Terra em km
      
      const lat1 = parseFloat(origin.lat) * Math.PI / 180;
      const lat2 = parseFloat(dest.lat) * Math.PI / 180;
      const deltaLat = (parseFloat(dest.lat) - parseFloat(origin.lat)) * Math.PI / 180;
      const deltaLon = (parseFloat(dest.lon) - parseFloat(origin.lon)) * Math.PI / 180;
      
      // Validar valores numéricos
      if (isNaN(lat1) || isNaN(lat2) || isNaN(deltaLat) || isNaN(deltaLon)) {
        console.error('❌ Erro ao converter coordenadas para números');
        return null;
      }
      
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      const distance = R * c;
      
      // Validar resultado
      if (isNaN(distance) || distance <= 0) {
        console.error('❌ Distância calculada inválida:', distance);
        return null;
      }
      
      // Multiplicar por 1.3 para aproximar distância rodoviária (estimativa)
      const roadDistance = Math.round(distance * 1.3 * 100) / 100;
      
      console.log('📏 Distância em linha reta:', Math.round(distance * 100) / 100, 'km');
      console.log('🛣️ Distância rodoviária estimada (×1.3):', roadDistance, 'km');
      
      return roadDistance;
      
    } catch (error) {
      console.error('❌ Erro no cálculo Haversine:', error);
      return null;
    }
  }

  /**
   * Calcular preço total baseado na distância
   * @param {number} distanceKm - Distância em km
   * @returns {number} Preço total em R$
   */
  calculatePrice(distanceKm) {
    return Math.round(distanceKm * this.pricePerKm * 100) / 100;
  }

  /**
   * Formatar valor para moeda brasileira
   * @param {number} value - Valor numérico
   * @returns {string} Valor formatado
   */
  formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Definir status de cálculo
   * @param {boolean} status - True se está calculando
   */
  setCalculatingStatus(status) {
    this.isCalculating = status;
  }

  /**
   * Verificar se está calculando
   * @returns {boolean}
   */
  getCalculatingStatus() {
    return this.isCalculating;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.PriceCalculator = PriceCalculator;
}

