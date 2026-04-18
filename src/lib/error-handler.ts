/**
 * Centralized error handling with Kazakh messages
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage: string = "Сервер қатесі"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: {
    userMessage: "Email немесе құпия сөз қате",
    statusCode: 401,
  },
  EMAIL_ALREADY_EXISTS: {
    userMessage: "Email бұрыннан тіркелген",
    statusCode: 400,
  },
  USER_NOT_FOUND: {
    userMessage: "Қолданушы табылмады",
    statusCode: 404,
  },
  INVALID_EMAIL: {
    userMessage: "Email форматы қате",
    statusCode: 400,
  },
  PASSWORD_TOO_WEAK: {
    userMessage: "Құпия сөз жеткіліксіз күшті",
    statusCode: 400,
  },
  INVALID_RESET_CODE: {
    userMessage: "Төмендету коды қате немесе ескірген",
    statusCode: 400,
  },

  // Rate limiting
  TOO_MANY_REQUESTS: {
    userMessage: "Тым көп талапты ұсындыңыз. Кейін қайта көңіл бөріңіз",
    statusCode: 429,
  },

  // Validation errors
  VALIDATION_ERROR: {
    userMessage: "Енгізілген деректер қате",
    statusCode: 400,
  },
  MISSING_FIELDS: {
    userMessage: "Міндетті өрістерді толтырыңыз",
    statusCode: 400,
  },

  // Authorization errors
  UNAUTHORIZED: {
    userMessage: "Рұқсат жоқ",
    statusCode: 401,
  },
  FORBIDDEN: {
    userMessage: "Бұл әрекетке рұқсатыңыз жоқ",
    statusCode: 403,
  },

  // Database errors
  DATABASE_ERROR: {
    userMessage: "Деректер базасы қатесі",
    statusCode: 500,
  },
  CONSTRAINT_VIOLATION: {
    userMessage: "Деректер қызмет етпей қалды",
    statusCode: 400,
  },

  // Resource errors
  NOT_FOUND: {
    userMessage: "Іздеген нәрсе табылмады",
    statusCode: 404,
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    userMessage: "Сервер қатесі. Кейін қайта көңіл бөріңіз",
    statusCode: 500,
  },
};

export function handleError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: error.userMessage,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes("P2025")) {
      // Prisma not found error
      return {
        message: ErrorMessages.NOT_FOUND.userMessage,
        statusCode: ErrorMessages.NOT_FOUND.statusCode,
      };
    }

    if (error.message.includes("P2002")) {
      // Prisma unique constraint error
      return {
        message: ErrorMessages.CONSTRAINT_VIOLATION.userMessage,
        statusCode: ErrorMessages.CONSTRAINT_VIOLATION.statusCode,
      };
    }

    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return {
        message: error.message === "UNAUTHORIZED" ? ErrorMessages.UNAUTHORIZED.userMessage : ErrorMessages.FORBIDDEN.userMessage,
        statusCode: error.message === "UNAUTHORIZED" ? 401 : 403,
      };
    }

    console.error("Unhandled error:", error);
  }

  return {
    message: ErrorMessages.INTERNAL_SERVER_ERROR.userMessage,
    statusCode: ErrorMessages.INTERNAL_SERVER_ERROR.statusCode,
  };
}
