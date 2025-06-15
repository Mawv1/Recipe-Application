package org.example.recipeapplication.model;

import java.util.Set;

public enum Role {
    ADMIN(Set.of(
            Permission.RECIPE_CREATE,
            Permission.RECIPE_READ,
            Permission.RECIPE_UPDATE,
            Permission.RECIPE_DELETE,
            Permission.USER_CREATE,
            Permission.USER_READ,
            Permission.USER_UPDATE,
            Permission.USER_DELETE,
            Permission.ADMIN_READ,
            Permission.ADMIN_UPDATE,
            Permission.ADMIN_DELETE,
            Permission.ADMIN_CREATE,
            Permission.CATEGORY_CREATE
    )),
    USER(Set.of(
            Permission.RECIPE_READ,
            Permission.USER_READ,
            Permission.RECIPE_CREATE
    ));

    private final Set<Permission> permissions;

    Role(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}

