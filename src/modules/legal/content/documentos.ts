// Contenido de /privacidad. Sale de la política oficial de la Fundación ROFÉ, "Política de Tratamiento de Datos y
// Aviso de Privacidad de sus Datos Personales" (DE-010-D, versión 1, 20/11/2023), publicada en POLITICA_OFICIAL.url.
// Regla: cada frase está respaldada por ese documento; no se agregan datos ni compromisos que no estén en él. Se
// incluyen las secciones que aplican a quien se inscribe (programas y envío de información). Una sola política
// para los 4 países. Los datos del responsable, la ley y la autoridad salen de shared/config/legal.ts.
import { LEY_DATOS, POLITICA_OFICIAL, RESPONSABLE, VERSION_PRIVACIDAD } from "@/shared/config/legal";

export type Seccion = {
  id: string;
  titulo: string;
  parrafos?: string[];
  /** Lista con letras o viñetas (definiciones, derechos, canales, pasos de un reclamo). */
  lista?: string[];
  /** Párrafos después de la lista. */
  cierre?: string[];
};

export type Documento = { titulo: string; version: string; resumen: string[]; secciones: Seccion[] };

const ley = LEY_DATOS.col;
const r = RESPONSABLE;

export const POLITICA: Documento = {
  titulo: POLITICA_OFICIAL.titulo,
  version: VERSION_PRIVACIDAD,
  // Resumen en lenguaje sencillo: cada punto remite a una sección de abajo (y del documento oficial).
  resumen: [
    `La ${r.nombre} (NIT ${r.nit}) es la responsable del tratamiento de tus datos personales.`,
    "Usamos tus datos para el desarrollo de nuestros programas y para enviarte información sobre ellos.",
    "Los datos sensibles solo se tratan con tu autorización expresa, y la Fundación se compromete a usarlos únicamente para los fines mencionados.",
    "Si eres menor de edad, la autorización la da tu representante legal o acudiente.",
    `Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización, escribiendo a ${r.correo}.`,
  ],
  secciones: [
    {
      id: "responsable",
      titulo: "1. Responsable del tratamiento",
      parrafos: [
        `El responsable del tratamiento de tus datos personales es la ${r.nombre}, entidad sin ánimo de lucro, constituida bajo la modalidad de Fundación, identificada con NIT ${r.nit}, domiciliada en la ${r.direccion}, página web ${r.web} y con correo electrónico ${r.correo}.`,
        `La ${r.nombre} podrá entregar a terceros la información captada, en calidad de Encargados, para cumplir las finalidades que se relacionan en esta Política.`,
      ],
    },
    {
      id: "marco",
      titulo: "2. Marco legal y objeto",
      parrafos: [
        `Esta Política de Tratamiento de Datos fue elaborada de conformidad con ${ley.marco}, y demás normas que las modifiquen o complementen (la "Normatividad"), con el objeto de establecer las condiciones de la captura, autorización y uso de los datos personales que hace la ${r.nombre} en el desarrollo de sus actividades.`,
        "Su objeto es regular los procedimientos de recolección y tratamiento de los datos personales que captura la Fundación, a fin de garantizar y proteger de forma efectiva el derecho fundamental de habeas data de los titulares.",
      ],
    },
    {
      id: "definiciones",
      titulo: "3. Definiciones",
      lista: [
        "a. Autorización: consentimiento previo, expreso e informado de los Titulares para llevar a cabo el Tratamiento de Datos Personales.",
        "b. Base(s) de Datos: conjunto organizado de Datos Personales que sea objeto de Tratamiento.",
        "c. Dato Personal: cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.",
        "d. Responsable del Tratamiento: persona que por sí misma o en asociación con otros decide sobre las Bases de Datos y/o el Tratamiento de los Datos Personales.",
        "e. Titulares: personas naturales cuyos Datos Personales sean objeto de Tratamiento.",
        "f. Tratamiento: cualquier operación o conjunto de operaciones sobre Datos Personales, tales como la recolección, almacenamiento, uso, circulación o supresión.",
      ],
    },
    {
      id: "sensibles",
      titulo: "4. Datos sensibles",
      parrafos: [
        "De acuerdo con la Ley Estatutaria 1581 de 2012 y sus decretos reglamentarios, son datos sensibles aquellos que, por su naturaleza, pueden afectar la intimidad del titular o cuyo uso indebido podría dar lugar a su discriminación. Esto incluye información que revele el origen racial o étnico, opiniones políticas, convicciones religiosas o filosóficas, membresía en sindicatos, organizaciones sociales o de derechos humanos, datos que promuevan intereses de partidos políticos o garanticen derechos y garantías de partidos políticos de oposición, así como datos relativos a la salud, la vida sexual y los biométricos.",
        "El tratamiento de estos datos está prohibido, a menos que el titular otorgue su autorización expresa, específica e informada, obtenida previamente. Como titular, tienes la libertad de negar o revocar tu consentimiento para el tratamiento de tus datos sensibles en cualquier momento, a excepción de los casos en que la ley exija su recolección por razones de interés general o para la salvaguarda de un derecho fundamental.",
        `La ${r.nombre} recopila datos sensibles dentro del desarrollo de sus Programas, en particular datos biométricos y socioeconómicos, con el fin de direccionar las ayudas y hacer los seguimientos de forma adecuada de cada uno de los beneficiarios de sus programas.`,
        `La ${r.nombre} se compromete a utilizar tus datos sensibles únicamente para los fines mencionados, asegurando su confidencialidad y previniendo el uso no autorizado. Transcurridos 10 años desde la afiliación a alguno de sus programas, la Fundación eliminará toda la información, a menos que por disposición legal esté obligada a conservarla.`,
      ],
    },
    {
      id: "menores",
      titulo: "5. Menores de edad",
      parrafos: [
        "La autorización previa de los menores de edad debe ser otorgada por el representante legal del menor o acudiente, que en principio deberán dar la autorización de forma conjunta, a menos que ello no sea posible. Se deberá acreditar la condición del representante legal del menor mediante el Registro Civil o documento público que establezca la filiación.",
      ],
    },
    {
      id: "finalidades",
      titulo: "6. Finalidades",
      parrafos: ["Capturamos tus datos personales para las siguientes finalidades:"],
      lista: [
        `Desarrollo de los programas: la ${r.nombre} captura los datos de cada uno de los miembros de los programas de asistencia y desarrollo personal que ofrece, pudiendo incluir la información relativa al núcleo familiar y a las condiciones socioeconómicas.`,
        "Envío de información: capturamos tus datos telefónicos de celular y de correo electrónico y los conservamos en nuestros archivos, con el objeto de enviar información sobre nuestros programas y la invitación a participar como donantes, por mensajes cortos de texto (SMS), correos electrónicos y llamadas telefónicas.",
      ],
    },
    {
      id: "canales",
      titulo: "7. Canales y horarios de envío",
      parrafos: ["De acuerdo con los lineamientos de la Ley 2300, la información publicitaria solo se te enviará en los siguientes medios y horarios:"],
      lista: [
        "No se te contactará por varios canales dentro de una misma semana ni en más de una ocasión durante el mismo día.",
        "Envíos solo de lunes a viernes, de 7:00 a. m. a 7:00 p. m.",
        "Sábados, de 8:00 a. m. a 3:00 p. m.",
        "Domingos y festivos no se realizan envíos.",
      ],
    },
    {
      id: "derechos",
      titulo: "8. Derechos de los titulares",
      parrafos: ["De conformidad con la Normatividad, los titulares de los datos personales tienen los siguientes derechos:"],
      lista: [
        `a. Conocer, actualizar y rectificar sus Datos Personales frente a la ${r.nombre}.`,
        `b. Solicitar prueba de la Autorización otorgada a la ${r.nombre}, salvo cuando expresamente se exceptúe como requisito para el Tratamiento, de conformidad con la Normatividad.`,
        `c. Ser informado por la ${r.nombre} respecto del uso que le ha dado a sus Datos Personales.`,
        "d. Presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a lo dispuesto en la Normatividad.",
        "e. Revocar la Autorización y/o solicitar la supresión del Dato Personal cuando en el Tratamiento no se respeten los principios, derechos y garantías constitucionales y legales, o esa sea su voluntad, siempre que no exista una obligación legal o contractual para mantener los datos.",
        "f. Acceder en forma gratuita a sus Datos Personales que hayan sido objeto de Tratamiento.",
      ],
    },
    {
      id: "consultas",
      titulo: "9. Consultas",
      parrafos: [
        "Tienes derecho a conocer si tus Datos Personales están siendo objeto de Tratamiento y, en caso afirmativo, conocer los Datos Personales que reposan en las Bases de Datos, así como el alcance, las condiciones y las generalidades de dicho tratamiento.",
      ],
      lista: [
        `Dirige tu consulta a ${r.correo}, adjuntando una copia de tu documento de identidad.`,
        "Las consultas se atienden en un término máximo de diez (10) días hábiles contados a partir de la fecha de recibo.",
        "Cuando no sea posible atender la consulta dentro de ese término, se te informará por escrito, expresando los motivos de la demora y señalando la fecha en que se atenderá, que en ningún caso podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer término.",
      ],
      cierre: [`También puedes presentar tus consultas y reclamos en la dirección ${r.direccion}, o al correo ${r.correo}.`],
    },
    {
      id: "reclamos",
      titulo: "10. Reclamos",
      parrafos: [
        "Si tú o tus causahabientes consideran que la información contenida en alguna de nuestras bases de datos debe ser objeto de corrección, actualización o supresión, o advierten el presunto incumplimiento de cualquiera de los deberes en el uso de tus datos, pueden presentar un reclamo, que se tramita bajo las siguientes reglas:",
      ],
      lista: [
        `El reclamo se formula mediante solicitud dirigida a la ${r.nombre} al correo ${r.correo}, con la identificación del Titular, copia de su documento de identidad, la descripción de los hechos que dan lugar al reclamo, la dirección y los documentos que se quiera hacer valer.`,
        "Si el reclamo resulta incompleto, se requerirá al interesado dentro de los cinco (5) días calendario siguientes a la recepción del reclamo para que subsane las fallas.",
        "Transcurridos dos (2) meses desde la fecha del requerimiento sin que el solicitante presente la información requerida, se entenderá que ha desistido del reclamo.",
        "Una vez recibido el reclamo completo, se incluirá en la respectiva base de datos una leyenda que diga \"reclamo en trámite\" y el motivo de este, en un término no mayor a dos (2) días hábiles. La leyenda se mantiene hasta que el reclamo sea decidido.",
        "El término máximo para atender el reclamo es de quince (15) días hábiles contados a partir del día siguiente a la fecha de su recibo.",
        "Cuando no sea posible atender el reclamo dentro de ese término, se informarán al interesado los motivos de la demora y la fecha en que se atenderá, que en ningún caso podrá superar los ocho (8) días hábiles siguientes al vencimiento del primer término.",
      ],
    },
    {
      id: "queja",
      titulo: "11. Queja ante la Superintendencia de Industria y Comercio",
      parrafos: [
        `Si tu queja o reclamo no es atendido en el plazo establecido o no estás conforme con la respuesta, puedes presentar una queja ante ${ley.autoridad}, por medio de su página web ${ley.autoridadWeb.replace("https://", "")} o a su correo electrónico ${ley.autoridadCorreo}.`,
      ],
    },
    {
      id: "vigencia",
      titulo: "12. Vigencia",
      parrafos: [`Esta política rige a partir del 20 de noviembre de 2023 (documento ${POLITICA_OFICIAL.codigo}, versión ${POLITICA_OFICIAL.version}).`],
    },
  ],
};
