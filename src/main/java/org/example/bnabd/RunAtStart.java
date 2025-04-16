package org.example.bnabd;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class RunAtStart {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    @Autowired
    public RunAtStart(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    // Dodaj beana do utrwalenia klas
    @Bean
    public CommandLineRunner runner (EmployeeRepository employeeRepository){
        return args -> {
            System.out.println("Baza danych:");

            Employee employee1 = new Employee("Jan", "Nowak", BigDecimal.valueOf(1000));
            Employee employee2 = new Employee("Jan", "Kowalski", BigDecimal.valueOf(2000));
            Employee employee3 = new Employee("Jan", "Kamiński", BigDecimal.valueOf(3000));

            employeeRepository.save(employee1);
            employeeRepository.save(employee2);
            employeeRepository.save(employee3);

            Employee employee21 = new Employee("Marta", "Miłosz", BigDecimal.valueOf(5321));
            Employee employee22 = new Employee("Jarek", "Psikuta", BigDecimal.valueOf(10000));
            Employee employee23 = new Employee("Marek", "Gość", BigDecimal.valueOf(4287));
            Employee employee24 = new Employee("Izabela", "Kwaśniak", BigDecimal.valueOf(3271));

            employeeRepository.save(employee21);
            employeeRepository.save(employee22);
            employeeRepository.save(employee23);
            employeeRepository.save(employee24);

            showEmployees();

            System.out.println("Pracownicy z nazwiskiem rozpoczynającym sie od konkretnej litery (k):");
            showEmployeeWhichLastNameStartsWithLetter('k');

            // ================================================================================================================= //

            Department department1 = new Department("R&D", "Sienkiewicza 123", 3, List.of(employee1, employee2, employee3));
            departmentRepository.save(department1);

            Department department2 = new Department("Finance", "Mickiewicza 3", 2, List.of(employee21, employee22, employee23, employee24));
            departmentRepository.save(department2);

            System.out.println("Działy z bazy danych:");

            List<Department> departments = departmentRepository.getAllDepartments();
            for(Department department : departments){
                System.out.println(department);
            }
        };
    }

    // Struktura kilku encji i relacje 1-1

    // Prezentacja danych z bazy danych
    public void showEmployees() {
        System.out.println("Pracownicy z bazy danych:");
        for (Employee employee : employeeRepository.findAll()) {
            System.out.println(employee.toString());
        }
    }

    public void showEmployeeWhichLastNameStartsWithLetter(Character letter) {
        Iterable<Employee> employees = employeeRepository.findByLastNameStartsWith(letter.toString());
        for (Employee employee : employees) {
            System.out.println(employee);
        }
    }
}
