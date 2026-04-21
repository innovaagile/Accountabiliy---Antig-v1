export interface PreguntaMES {
  id: string;
  texto: string;
  dimension: string;
}

export const preguntasMES: PreguntaMES[] = [
  { id: '1', texto: 'Mi equipo no sigue los procesos documentados', dimension: 'Procesos' },
  { id: '2', texto: 'Hay falta de comunicación entre departamentos', dimension: 'Comunicación' },
  { id: '3', texto: 'Las tareas se retrasan con frecuencia', dimension: 'Ejecución' },
  { id: '4', texto: 'Me cuesta delegar responsabilidades', dimension: 'Liderazgo' },
  { id: '5', texto: 'No tenemos métricas claras de desempeño', dimension: 'Indicadores' },
  { id: '6', texto: 'Hay alta rotación de personal en el equipo', dimension: 'Cultura' },
  { id: '7', texto: 'Los clientes se quejan de la calidad del servicio', dimension: 'Calidad' },
  { id: '8', texto: 'La toma de decisiones es muy lenta', dimension: 'Agilidad' }
];
