package org.example.bnabd;

public class NoEmployeesInDepartmentException extends Exception {
    public NoEmployeesInDepartmentException() {
        super("No employees found in the department.");
    }

    public NoEmployeesInDepartmentException(String message) {
        super(message);
    }

    public NoEmployeesInDepartmentException(String message, Throwable cause) {
        super(message, cause);
    }

    public NoEmployeesInDepartmentException(Throwable cause) {
        super(cause);
    }
}

