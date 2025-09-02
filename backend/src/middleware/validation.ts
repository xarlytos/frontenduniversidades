import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((error: any) => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg
      }))
    });
    return;
  }
  
  next();
};

// Función helper para ejecutar validaciones
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Ejecutar todas las validaciones
    for (const validation of validations) {
      await validation.run(req);
    }
    
    // Verificar errores
    handleValidationErrors(req, res, next);
  };
};