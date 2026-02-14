import { Project, Node, SourceFile } from 'ts-morph';
import * as path from 'path';

export interface ExtractionResult {
  success: boolean;
  imports?: string;
  properties?: string;
  methodBody?: string;
  lineNumber?: number;
  error?: string;
}

export interface ListMethodsResult {
  success: boolean;
  methods?: string[];
  error?: string;
}

export class TypeScriptExtractor {
  private project: Project;

  constructor() {
    this.project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * List all method and function names in a TypeScript file
   */
  public listMethods(filePath: string): ListMethodsResult {
    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

      // Add source file to project
      const sourceFile = this.project.addSourceFileAtPath(absolutePath);

      const methodNames = new Set<string>();

      // Find function declarations
      for (const func of sourceFile.getFunctions()) {
        const name = func.getName();
        if (name) {
          methodNames.add(name);
        }
      }

      // Find class methods (instance and static)
      for (const classDecl of sourceFile.getClasses()) {
        for (const method of classDecl.getMethods()) {
          methodNames.add(method.getName());
        }
        for (const staticMethod of classDecl.getStaticMethods()) {
          methodNames.add(staticMethod.getName());
        }
      }

      // Find arrow functions and function expressions in variable declarations
      for (const variable of sourceFile.getVariableDeclarations()) {
        const initializer = variable.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
          methodNames.add(variable.getName());
        }
      }

      // Find interface methods
      for (const interfaceDecl of sourceFile.getInterfaces()) {
        for (const method of interfaceDecl.getMethods()) {
          methodNames.add(method.getName());
        }
      }

      // Find methods in type aliases
      for (const typeAlias of sourceFile.getTypeAliases()) {
        const typeNode = typeAlias.getTypeNode();
        if (typeNode && Node.isTypeLiteral(typeNode)) {
          for (const member of typeNode.getMembers()) {
            if (Node.isMethodSignature(member)) {
              methodNames.add(member.getName());
            }
          }
        }
      }

      return {
        success: true,
        methods: Array.from(methodNames).sort(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Error processing file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Extract imports and method body from a TypeScript file
   */
  public extractMethod(filePath: string, methodName: string): ExtractionResult {
    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

      // Add source file to project
      const sourceFile = this.project.addSourceFileAtPath(absolutePath);

      // Find the method/function
      const method = this.findMethod(sourceFile, methodName);

      if (!method) {
        return {
          success: false,
          error: `Method or function '${methodName}' not found in ${filePath}`,
        };
      }

      // Extract method body
      const methodBody = this.getMethodBody(method);

      // Get line number of the method
      const lineNumber = method.getStartLineNumber();

      // Get used identifiers in the method
      const usedIdentifiers = this.getUsedIdentifiers(method);

      // Extract only relevant imports
      const imports = this.extractRelevantImports(sourceFile, usedIdentifiers);

      // Extract class properties and constants (only for class methods)
      const properties = this.extractClassProperties(sourceFile, method, usedIdentifiers);

      return {
        success: true,
        imports,
        properties,
        methodBody,
        lineNumber,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error processing file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Find a method or function by name in the source file
   */
  private findMethod(sourceFile: SourceFile, methodName: string): Node | null {
    // Try to find as a function declaration
    const functionDeclaration = sourceFile.getFunction(methodName);
    if (functionDeclaration) {
      return functionDeclaration;
    }

    // Try to find as a class method
    for (const classDecl of sourceFile.getClasses()) {
      const method = classDecl.getMethod(methodName);
      if (method) {
        return method;
      }

      // Check static methods
      const staticMethod = classDecl.getStaticMethod(methodName);
      if (staticMethod) {
        return staticMethod;
      }
    }

    // Try to find as an arrow function or function expression in variable declaration
    for (const variable of sourceFile.getVariableDeclarations()) {
      if (variable.getName() === methodName) {
        const initializer = variable.getInitializer();
        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
          return variable;
        }
      }
    }

    // Try to find in interfaces
    for (const interfaceDecl of sourceFile.getInterfaces()) {
      for (const method of interfaceDecl.getMethods()) {
        if (method.getName() === methodName) {
          return method;
        }
      }
    }

    // Try to find in type aliases
    for (const typeAlias of sourceFile.getTypeAliases()) {
      const typeNode = typeAlias.getTypeNode();
      if (typeNode && Node.isTypeLiteral(typeNode)) {
        for (const member of typeNode.getMembers()) {
          if (Node.isMethodSignature(member) && member.getName() === methodName) {
            return member;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get the full text of the method/function
   */
  private getMethodBody(node: Node): string {
    if (Node.isVariableDeclaration(node)) {
      // For arrow functions and function expressions in variable declarations
      return node.getText();
    }

    return node.getText();
  }

  /**
   * Get all identifiers used in the method
   */
  private getUsedIdentifiers(node: Node): Set<string> {
    const identifiers = new Set<string>();

    node.forEachDescendant((child) => {
      if (Node.isIdentifier(child)) {
        identifiers.add(child.getText());
      }
    });

    return identifiers;
  }

  /**
   * Extract imports that are actually used in the method
   */
  private extractRelevantImports(sourceFile: SourceFile, usedIdentifiers: Set<string>): string {
    const relevantImports: string[] = [];

    for (const importDecl of sourceFile.getImportDeclarations()) {
      let isRelevant = false;

      // Check named imports
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        const name = namedImport.getName();
        if (usedIdentifiers.has(name)) {
          isRelevant = true;
          break;
        }
      }

      // Check default import
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport && usedIdentifiers.has(defaultImport.getText())) {
        isRelevant = true;
      }

      // Check namespace import
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport && usedIdentifiers.has(namespaceImport.getText())) {
        isRelevant = true;
      }

      // Only include if relevant AND from project directory
      if (isRelevant && this.isProjectImport(importDecl.getModuleSpecifierValue())) {
        relevantImports.push(importDecl.getText());
      }
    }

    return relevantImports.join('\n');
  }

  /**
   * Extract class properties and constants that are used in the method
   * Only works for class methods, returns empty string for standalone functions
   */
  private extractClassProperties(sourceFile: SourceFile, method: Node, usedIdentifiers: Set<string>): string {
    const properties: string[] = [];

    // Check if this is a class method
    let parentClass = method.getParent();
    while (parentClass && !Node.isClassDeclaration(parentClass)) {
      parentClass = parentClass.getParent();
    }

    if (!parentClass || !Node.isClassDeclaration(parentClass)) {
      // Not a class method, return empty
      return '';
    }

    // Get properties from the method's own class
    const ownClassProperties = this.extractPropertiesFromClass(parentClass, usedIdentifiers);
    properties.push(...ownClassProperties);

    // Find other classes referenced in the method
    const referencedClasses = this.findReferencedClasses(sourceFile, usedIdentifiers);
    for (const referencedClass of referencedClasses) {
      if (referencedClass !== parentClass) {
        const classProperties = this.extractPropertiesFromClass(referencedClass, usedIdentifiers);
        properties.push(...classProperties);
      }
    }

    return properties.join('\n\n');
  }

  /**
   * Extract property declarations from a class that match used identifiers
   */
  private extractPropertiesFromClass(classDecl: Node, usedIdentifiers: Set<string>): string[] {
    if (!Node.isClassDeclaration(classDecl)) {
      return [];
    }

    const properties: string[] = [];

    // Extract instance properties
    for (const property of classDecl.getProperties()) {
      const propertyName = property.getName();
      if (usedIdentifiers.has(propertyName)) {
        properties.push(property.getText());
      }
    }

    // Extract static properties (constants)
    for (const property of classDecl.getStaticProperties()) {
      const propertyName = property.getName();
      if (usedIdentifiers.has(propertyName)) {
        properties.push(property.getText());
      }
    }

    return properties;
  }

  /**
   * Find all class declarations that are referenced by the used identifiers
   */
  private findReferencedClasses(sourceFile: SourceFile, usedIdentifiers: Set<string>): Node[] {
    const referencedClasses: Node[] = [];

    for (const classDecl of sourceFile.getClasses()) {
      const className = classDecl.getName();
      if (className && usedIdentifiers.has(className)) {
        referencedClasses.push(classDecl);
      }
    }

    return referencedClasses;
  }

  /**
   * Check if an import is from the project directory
   * Returns true for relative paths (./, ../) or paths starting with src/
   */
  private isProjectImport(moduleSpecifier: string): boolean {
    return moduleSpecifier.startsWith('./') ||
           moduleSpecifier.startsWith('../') ||
           moduleSpecifier.startsWith('src/');
  }
}
