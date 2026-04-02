package com.paineltask.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " não encontrado(a) com id: " + id);
    }
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
