// [TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA] Contenido de /privacidad y /terminos. La Fundación ROFÉ redacta y
// aprueba el texto final: se reemplaza aquí, y si cambia lo que la persona acepta, cambia su versión en
// shared/config/legal.ts. Lo que depende del país (ley y autoridad) sale de esa misma configuración.
// Lo que aún no está definido se marca con [POR CONFIRMAR] y se ve resaltado.
import { LEY_DATOS, RESPONSABLE, VERSION_PRIVACIDAD, VERSION_TERMINOS, type LeyDatos } from "@/shared/config/legal";
import { CONTACTO } from "@/shared/config/sitio";

export type Seccion = { id: string; titulo: string; parrafos: string[] };
export type Documento = {
  id: "privacidad" | "terminos";
  titulo: string;
  version: string;
  /** Si es true, la sección de la ley cambia con el país elegido. */
  porPais: boolean;
  secciones: (ley: LeyDatos, pais: string) => Seccion[];
};

export const PROVISIONAL = "[TEXTO LEGAL PROVISIONAL – REVISIÓN JURÍDICA]";
export const NOTA_PROVISIONAL = "La Fundación ROFÉ redacta y aprueba el texto final. Mientras tanto, este texto explica en lenguaje sencillo cómo funciona.";

const contacto = CONTACTO.correo;

export const PRIVACIDAD: Documento = {
  id: "privacidad",
  titulo: "Política de privacidad y tratamiento de datos",
  version: VERSION_PRIVACIDAD,
  porPais: true,
  secciones: (ley, pais) => [
    { id: "responsable", titulo: "1. Quién es el responsable", parrafos: [`El responsable de tus datos personales es la ${RESPONSABLE}. Para cualquier pregunta sobre tus datos, escríbenos a ${contacto}.`] },
    {
      id: "datos", titulo: "2. Qué datos recogemos",
      parrafos: [
        "Los que escribes en el formulario de inscripción: datos de contacto e identificación, ciudad y sede, estudios y disponibilidad, ocupación y, si eres menor de edad, los datos de tu madre, padre o adulto responsable.",
        "También guardamos qué autorizaciones aceptaste, con la versión del texto y la fecha, y de dónde llegaste a la convocatoria (por ejemplo, un enlace de una red social). No guardamos tu dirección IP: solo una huella cifrada para detectar abusos.",
      ],
    },
    {
      id: "finalidad", titulo: "3. Para qué los usamos",
      parrafos: [
        "Para gestionar tu inscripción y el proceso de selección.",
        "Para contactarte, por WhatsApp o correo, sobre el proceso de selección y el programa.",
        "Para elaborar estadísticas del programa, siempre sumadas: en ellas nadie se puede identificar.",
      ],
    },
    {
      id: "sensibles", titulo: "4. Datos sensibles",
      parrafos: [
        "El género, las poblaciones con las que te identificas y los ingresos del hogar son datos sensibles. Responderlos es voluntario: puedes dejarlos en «Prefiero no responder» y eso no afecta tu inscripción.",
        "Solo se usan sumados, para estadísticas e informes del programa. Dentro de la Fundación, el detalle por persona solo lo ve el equipo de administración.",
      ],
    },
    { id: "terceros", titulo: "5. Con quién los compartimos", parrafos: ["No vendemos tus datos ni los compartimos con terceros, salvo lo necesario para operar el programa (por ejemplo, el servicio donde se guardan de forma segura)."] },
    {
      id: "derechos", titulo: "6. Tus derechos",
      parrafos: [
        "Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización que diste, cuando quieras y sin costo.",
        `Para hacerlo, escríbenos a ${contacto} con tu número de documento.`,
      ],
    },
    { id: "ley", titulo: `7. Ley aplicable en ${pais}`, parrafos: [`En ${pais} aplica la ${ley.ley}. Si consideras que no atendimos bien tu solicitud, puedes presentar un reclamo ante ${ley.autoridad}.`] },
    { id: "menores", titulo: "8. Menores de edad", parrafos: ["Si tienes menos de 18 años, tu madre, padre o adulto responsable también debe autorizar la inscripción y el tratamiento de tus datos. Para inscribirte necesitas tener al menos 14 años."] },
    {
      id: "conservacion", titulo: "9. Cuánto tiempo y cómo los guardamos",
      parrafos: ["Plazo de conservación: [POR CONFIRMAR]. El acceso al panel de inscripciones está restringido por rol y por país, y queda registrado quién exporta datos personales."],
    },
    { id: "contacto", titulo: "10. Contacto", parrafos: [`Único canal para dudas y para ejercer tus derechos: ${contacto}.`] },
  ],
};

export const TERMINOS: Documento = {
  id: "terminos",
  titulo: "Términos y condiciones",
  version: VERSION_TERMINOS,
  porPais: false,
  secciones: () => [
    { id: "objeto", titulo: "1. Objeto del programa", parrafos: ["Jóvenes creaTIvos es el programa de formación en tecnología de la Fundación ROFÉ para jóvenes de Colombia, Ecuador, Panamá y Uruguay. La cohorte 2027 va de marzo a noviembre de 2027, con mínimo 8 horas por semana, 80 % virtual y 20 % presencial."] },
    {
      id: "inscripcion", titulo: "2. Inscripción y selección",
      parrafos: [
        "La inscripción es gratuita y se hace solo por el formulario oficial. Inscribirse no garantiza un cupo. Criterios y fechas de selección: [POR CONFIRMAR].",
        "Quien sea menor de edad necesita la autorización de su madre, padre o adulto responsable.",
      ],
    },
    {
      id: "beca", titulo: "3. Beca y qué incluye",
      parrafos: [
        "La beca cubre el 100 % de la formación: Habilidades Esenciales, Emprender y Desarrollo de Software, visitas pedagógicas, certificado, comunidad, apoyo y acompañamiento, y asesorías de emprendimiento.",
        "No incluye computador o computadora ni otros equipos, ayudas económicas ni acceso a internet.",
      ],
    },
    { id: "compromisos", titulo: "4. Compromisos de quien participa", parrafos: ["Dedicar mínimo 8 horas por semana, asistir a las sesiones virtuales y a los encuentros presenciales de su sede, y respetar las normas de convivencia de la comunidad. Porcentaje mínimo de asistencia: [POR CONFIRMAR]."] },
    { id: "certificacion", titulo: "5. Certificación", parrafos: ["Se entrega un certificado a quien cumpla los criterios de asistencia y aprobación: [POR CONFIRMAR]."] },
    { id: "imagen", titulo: "6. Uso de imagen y voz", parrafos: ["La Fundación solo usa fotos y videos de quien lo autoriza expresamente. La autorización se puede revocar en cualquier momento."] },
    { id: "retiro", titulo: "7. Retiro", parrafos: ["Quien participa puede retirarse cuando quiera avisando a la Fundación. Causales de retiro por parte de la Fundación: [POR CONFIRMAR]."] },
    { id: "datos", titulo: "8. Datos personales", parrafos: ["El tratamiento de los datos personales se rige por la Política de privacidad y tratamiento de datos."] },
    { id: "cambios", titulo: "9. Cambios a estos términos", parrafos: ["Si estos términos cambian, publicaremos una nueva versión con su fecha y la comunicaremos por correo."] },
  ],
};

export { LEY_DATOS };
