function clasificarAlerta(valor, config) {
  const margen = 5;

  // Protección: si la config no tiene datos, regresar sin_config
  if (!config || config.hipo_min == null || config.normal_min == null || config.normal_max == null || config.hiper_max == null) {
    console.log("⚠️ Configuración incompleta o inexistente");
    return { tipo: "sin_config" };
  }

  // 🔴 HIPOGUCEMIA (roja)
  if (valor < config.hipo_min) {
    return {
      tipo: "roja",
      comparador: "<",
      prioridad: 3,
      estado: "pendiente"
    };
  }

  // 🔴 HIPERGLUCEMIA (roja)
  if (valor > config.hiper_max) {
    return {
      tipo: "roja",
      comparador: ">",
      prioridad: 3,
      estado: "pendiente"
    };
  }

  // 🟡 AMARILLA – Riesgo por abajo
  if (valor < config.normal_min && valor >= config.normal_min - margen) {
    return {
      tipo: "amarilla",
      comparador: "<",
      prioridad: 2,
      estado: "pendiente"
    };
  }

  // 🟡 AMARILLA – Riesgo por arriba
  if (valor > config.normal_max && valor <= config.normal_max + margen) {
    return {
      tipo: "amarilla",
      comparador: ">",
      prioridad: 2,
      estado: "pendiente"
    };
  }

  // 🟢 VERDE – Dentro de rango
  return {
    tipo: "verde",
    comparador: "entre",
    prioridad: 1,
    estado: "procesada"
  };
}

module.exports = clasificarAlerta;
