module.exports = {
  read: async (usuarioId) => {
    const valor = Math.floor(Math.random() * 130) + 70; // 70-200 mg/dL
    const timestamp = new Date();

    console.log(`🔹 Simulación: lectura para usuario ${usuarioId} = ${valor} mg/dL`);

    return { value: valor, timestamp };
  }
};
