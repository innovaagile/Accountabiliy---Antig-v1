export interface PreguntaMES {
  id: string;
  texto: string;
  dimension: string;
}

export const preguntasMES: PreguntaMES[] = [
  // Comunicación
  { id: '1', texto: 'Nuestra comunicación interna suele ser reactiva y ocurrir cuando ya existe una urgencia.', dimension: 'Comunicación' },
  { id: '2', texto: 'Los correos electrónicos y mensajes se usan para evadir conversaciones difíciles directas.', dimension: 'Comunicación' },
  { id: '3', texto: 'La información clave rara vez fluye eficientemente de arriba hacia abajo en la jerarquía.', dimension: 'Comunicación' },
  { id: '4', texto: 'Múltiples canales (WhatsApp, Slack, mail) causan confusión sobre dónde encontrar los acuerdos.', dimension: 'Comunicación' },

  // Alineamiento Estratégico
  { id: '5', texto: 'Mis colaboradores no sabrían explicar cómo sus tareas diarias impactan en la meta anual.', dimension: 'Alineamiento Estratégico' },
  { id: '6', texto: 'Se inician muchos proyectos simultáneos pero pocos logran terminar con éxito y a tiempo.', dimension: 'Alineamiento Estratégico' },
  { id: '7', texto: 'El equipo prioriza las urgencias del "día a día" por sobre el avance de los proyectos críticos.', dimension: 'Alineamiento Estratégico' },
  { id: '8', texto: 'Los objetivos trimestrales no están definidos o son ignorados una vez que comienza el mes.', dimension: 'Alineamiento Estratégico' },

  // Reuniones Inconducentes
  { id: '9', texto: 'Casi todas nuestras reuniones carecen de una agenda clara compartida previamente.', dimension: 'Reuniones Inconducentes' },
  { id: '10', texto: 'En la mayoría de las juntas participamos demasiadas personas innecesariamente.', dimension: 'Reuniones Inconducentes' },
  { id: '11', texto: 'Las reuniones raramente terminan con un acta clara de accionables y responsables únicos.', dimension: 'Reuniones Inconducentes' },
  { id: '12', texto: 'Volvemos a debatir en reuniones sobre temas que supuestamente ya habíamos decidido antes.', dimension: 'Reuniones Inconducentes' },

  // Liderazgo Reactivo
  { id: '13', texto: 'Me siento más un "apagafuegos" resolviendo urgencias de otros que un líder estratégico.', dimension: 'Liderazgo Reactivo' },
  { id: '14', texto: 'Al delegar una tarea, usualmente sufro estrés preguntándome si realmente se hará bien.', dimension: 'Liderazgo Reactivo' },
  { id: '15', texto: 'Con frecuencia debo intervenir en tareas operativas porque no confío en que el equipo responda.', dimension: 'Liderazgo Reactivo' },
  { id: '16', texto: 'Siento que el equipo colapsaría si me ausento bruscamente durante dos semanas seguidas.', dimension: 'Liderazgo Reactivo' },

  // Gestión del Tiempo
  { id: '17', texto: 'El equipo suele reportar trabajar más horas de la cuenta, pero hay bajo impacto final real.', dimension: 'Gestión del Tiempo' },
  { id: '18', texto: 'Las interrupciones constantes, preguntas y correos hacen imposible lograr foco profundo.', dimension: 'Gestión del Tiempo' },
  { id: '19', texto: 'No utilizamos bloques de trabajo aislado (Timeblocking) como cultura estándar del equipo.', dimension: 'Gestión del Tiempo' },
  { id: '20', texto: 'Pasamos gran parte del día respondiendo a exigencias en lugar de accionar nuestro plan.', dimension: 'Gestión del Tiempo' },

  // Relaciones Laborales
  { id: '21', texto: 'Existen fricciones ocultas entre miembros clave que impactan la entrega del proyecto final.', dimension: 'Relaciones Laborales' },
  { id: '22', texto: 'Hay un ambiente de queja constante pasivo-agresiva en lugar de propuestas de soluciones.', dimension: 'Relaciones Laborales' },
  { id: '23', texto: 'Las discusiones de equipo suelen volverse defensivas y personales muy rápidamente.', dimension: 'Relaciones Laborales' },
  { id: '24', texto: 'Se toleran actitudes mediocres de ciertas personas sin que existan consecuencias reales.', dimension: 'Relaciones Laborales' },

  // Pensamiento Sistémico
  { id: '25', texto: 'Cambiamos frecuentemente de prioridades cuando aparece una "idea nueva" del liderazgo.', dimension: 'Pensamiento Sistémico' },
  { id: '26', texto: 'Un problema en un área pequeña frecuentemente termina desestabilizando a otras áreas.', dimension: 'Pensamiento Sistémico' },
  { id: '27', texto: 'Resolvemos errores puntuales en lugar de diseñar sistemas que eviten su reaparición.', dimension: 'Pensamiento Sistémico' },
  { id: '28', texto: 'Falta un diagrama o mapa de procesos donde todos entiendan de dónde vienen y van las métricas.', dimension: 'Pensamiento Sistémico' },

  // Disciplina Operativa
  { id: '29', texto: 'Cuesta implementar cualquier herramienta de software porque nadie actualiza los datos a tiempo.', dimension: 'Disciplina Operativa' },
  { id: '30', texto: 'No tenemos tableros visibles semanales para medir si ganamos o perdemos el período.', dimension: 'Disciplina Operativa' },
  { id: '31', texto: 'No existe una cadencia estricta de seguimiento 1 a 1 de rendición de cuentas (Accountability).', dimension: 'Disciplina Operativa' },
  { id: '32', texto: 'El éxito de la empresa depende del talento heroico de 2 o 3 personas, no de los procesos.', dimension: 'Disciplina Operativa' }
];
