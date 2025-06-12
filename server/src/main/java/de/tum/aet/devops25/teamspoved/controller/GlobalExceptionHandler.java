/*
 * See https://blog.devops.dev/getting-started-with-validation-in-spring-boot-using-validator-1a7ab6d2d1f5
 */

package de.tum.aet.devops25.teamspoved.controller;

import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage()));
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConversionFailedException.class)
    public ResponseEntity<Map<String, String>> handleConversionFailed(ConversionFailedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Failed to convert value: '" + ex.getValue() + "' to type: " + ex.getTargetType());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
}
