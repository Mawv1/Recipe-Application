package org.example.bnabd;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends CrudRepository<Employee, Long> {
    @Query("SELECT e FROM Employee e WHERE e.lastName LIKE CONCAT(:letter, '%')")
    Iterable<Employee> findByLastNameStartsWith(@Param("letter") String letter);
}
