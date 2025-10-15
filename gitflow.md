# Gitflow y Convenciones de Commits

| Tipo         | Cuándo usarlo                                          | Ejemplo de rama                     | Ejemplo de commit                                    |
| ------------ | ------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------- |
| **feat**     | Nueva funcionalidad o módulo                           | `feature/student-enrollment-module`    | `feat(student): add enrollment module`               |
| **fix**      | Corrección de errores o bugs                           | `feature/student-save-null-error`       | `fix(student): handle null value on save`            |
| **refactor** | Mejorar código sin cambiar comportamiento              | `feature/student-service-layer`    | `refactor(student): simplify service layer`          |
| **chore**    | Tareas de mantenimiento (build, dependencias, configs) | `feature/student-update-dependencies` | `chore(student): update dependencies and cleanup`    |
| **docs**     | Cambios en documentación                               | `feature/student-readme-update`        | `docs(student): update README with usage examples`   |
| **test**     | Añadir o corregir pruebas                              | `feature/student-controller-tests`     | `test(student): add missing controller tests`        |
| **style**    | Cambios de formato o estilo (lint, espacios, etc.)     | `feature/student-code-format`         | `style(student): apply formatting rules`             |
| **perf**     | Mejoras de rendimiento                                 | `feature/student-cache-optimization`   | `perf(student): optimize cache performance`          |
| **hotfix**   | Corrección urgente en producción                       | `feature/student-grades-endpoint`    | `hotfix(student): fix grades endpoint returning 500` |

## Comandos para el flujo de Gitflow - Desarrolladores
```bash
# Cambiar a la rama de desarrollo
git switch develop
# Cada vez que interactúes con la rama develop, asegúrate de traer los últimos cambios
git pull origin develop
# Crear una nueva rama cada vez que implementes una nueva funcionalidad o corrección
git switch -c feature/<nombre-microservicio>-<descripción-corta>
# Después de hacer cambios, agrega los archivos modificados
git add .
# Realiza un commit con un mensaje descriptivo siguiendo las convenciones
git commit -m "<tipo>(<alcance>): <descripción-corta>"
# Sube la rama al repositorio remoto
git push origin feature/<nombre-microservicio>-<descripción-corta>
# Se comenta en el grupo de whatsapp que se ha subido una nueva funcionalidad o corrección y se integrará a develop y se eliminará la rama
# Ir a la rama develop y traer los últimos cambios
git switch develop
git pull origin develop
# Eliminar la rama local
git branch -d feature/<nombre-microservicio>-<descripción-corta>
```

## Notas (Si no se cumplen no se aceptan los cambios)
- Siempre trabaja en ramas nuevas basadas en `develop`.
- Siempre trae los últimos cambios de `develop` antes de crear una nueva rama.
- No modifiques directamente la rama `develop`, `main`.
- No modifiques archivos de otros microservicios ni configuraciones globales sin autorización.
- Asegúrate de que tus commits sean claros y sigan las convenciones establecidas.
- Realiza pruebas unitarias y de integración antes de subir tus cambios, con npm run build.

## Code Review
- Asegúrate de que el código sigue las convenciones establecidas.
- Verifica que los commits sean claros y descriptivos.
- Revisa que no haya conflictos con la rama develop.
- Asegúrate de que las pruebas unitarias y de integración pasen correctamente.
```bash
# Cambiar a la rama develop
git switch develop
# Traer los últimos cambios
git pull origin develop
# Traer las ramas remotas de los otros desarrolladores
git fetch origin
# Cambiar a la rama del desarrollador
git switch develop
# Hacer un merge de la rama develop para ver si hay conflictos
git merge feature/<nombre-microservicio>-<descripción-corta>
# Si hay conflictos, resolverlos y hacer un commit
git add .
git commit -m "fix: resolve merge conflicts with develop"
# Subir los cambios a la rama develop
git push origin develop
# Eliminar la rama del desarrollador
git branch -d feature/<nombre-microservicio>-<descripción-corta>
git push origin --delete feature/<nombre-microservicio>-<descripción-corta>
```