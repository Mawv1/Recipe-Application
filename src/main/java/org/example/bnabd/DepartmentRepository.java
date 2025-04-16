package org.example.bnabd;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DepartmentRepository extends CrudRepository<Department, Long> {

    @Query("SELECT e FROM Employee e WHERE e.department.id = :id")
    List<Employee> getDepartmentEmployees(@Param("id") Long id);

    @EntityGraph(attributePaths = "employeeList")
    @Query("SELECT d FROM Department d")
    List<Department> getAllDepartments();
}
