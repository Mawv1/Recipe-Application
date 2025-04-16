package org.example.bnabd;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private Integer level;

    @OneToMany
    private List<Employee> employeeList;

    public Department() {
        super();
    }

    public Department(String name, String address, Integer level, List<Employee> employeeList) {
        this.name = name;
        this.address = address;
        this.level = level;
        this.employeeList = employeeList;
    }

    @Override
    public String toString() {
        StringBuilder returnString = new StringBuilder(
                "Departament: [name=" + this.name + ", address=" + this.address + ", level=" + this.level + "]\n"
        );

        if (employeeList.isEmpty()) {
            returnString.append("Brak pracowników w tym dziale.\n");
        } else {
            for (Employee employee : employeeList) {
                returnString.append(employee.toString()).append("\n");
            }
        }

        return returnString.toString();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public List<Employee> getEmployeeList() {
        return employeeList;
    }

    public void setEmployeeList(List<Employee> employeeList) {
        this.employeeList = employeeList;
    }
}
