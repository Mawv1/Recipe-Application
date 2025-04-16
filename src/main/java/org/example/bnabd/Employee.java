package org.example.bnabd;

import jakarta.persistence.*;

import java.math.BigDecimal;

import static jakarta.persistence.GenerationType.AUTO;
@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = AUTO)
    private Long id;

    private String firstName;
    private String lastName;
    private BigDecimal salary;

    @ManyToOne
    private Department department;

    public Employee(){
        super();
    }

    public Employee(String firstName, String lastName, BigDecimal salary) {
        super();
        this.firstName = firstName;
        this.lastName = lastName;
        this.salary = salary;
    }

    public Long getId(){
        return id;
    }

    public void setId(Long id){
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public BigDecimal getSalary() {
        return salary;
    }

    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }

    @Override
    public String toString(){
        return "Employee [First name=" + firstName + ", last name=" + lastName + ", salary=" + salary + "]";
    }
}
