export interface Profesor {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  _count?: { alumnos: number };
  usuario?: { id: string; email: string } | null;
}

export interface Alumno {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  profesorId: string | null;
  profesor: { id: string; nombre: string; apellido: string } | null;
  clasesTotal: number;
  clasesUsadas: number;
  pagado: boolean;
  fechaPago: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
