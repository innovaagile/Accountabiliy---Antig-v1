export const normalizeService = (rawService: string): string => {
  if (!rawService) return "OTRO_SERVICIO";
  const serviceMap: Record<string, string> = {
    "sprint digital 4s": "SPRINT_4S",
    "sprint 4s": "SPRINT_4S",
    "sprint ejecutivo": "SPRINT_EJECUTIVO",
    "liderazgo agil": "LIDERAZGO_AGIL",
    "liderazgo ágil": "LIDERAZGO_AGIL",
    "executive mastery": "EXECUTIVE_MASTERY",
    "audit toolkit": "AUDIT_TOOLKIT",
    "enterprise execution": "ENTERPRISE_EXECUTION"
  };
  const cleanInput = rawService.toLowerCase().trim();
  
  // Si ya es un código de base de datos válido, devolverlo tal cual
  const dbCodes = Object.values(serviceMap);
  const isDbCode = dbCodes.some(code => code.toLowerCase() === cleanInput);
  if (isDbCode) {
    return rawService.toUpperCase().trim();
  }

  return serviceMap[cleanInput] || "OTRO_SERVICIO";
};

export const getFriendlyServiceName = (dbCode: string): string => {
  if (!dbCode) return "Otro Servicio";
  const map: Record<string, string> = {
    "SPRINT_4S": "Sprint Digital 4S",
    "SPRINT_EJECUTIVO": "Sprint Ejecutivo",
    "EXECUTIVE_MASTERY": "Executive Mastery",
    "LIDERAZGO_AGIL": "Liderazgo Ágil",
    "AUDIT_TOOLKIT": "Audit Toolkit",
    "ENTERPRISE_EXECUTION": "Enterprise Execution",
    "OTRO_SERVICIO": "Otro Servicio",
  };
  return map[dbCode] || dbCode;
};
