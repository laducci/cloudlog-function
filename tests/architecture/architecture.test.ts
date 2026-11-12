/** Testes de ARQUITETURA (ArchUnitTS) da Azure Function. */
import { metrics, projectFiles, projectSlices } from "archunit";

const imports = (content: string, pkg: string) => new RegExp(`from\\s+["']${pkg}["']`).test(content);

describe("Clean Architecture — regra de dependência", () => {
  it("as camadas seguem o diagrama permitido", async () => {
    const diagram = `
@startuml
  component [Domain]
  component [Application]
  component [Infrastructure]
  component [API]
  [Application] --> [Domain]
  [Infrastructure] --> [Domain]
  [API] --> [Application]
  [API] --> [Domain]
  [API] --> [Infrastructure]
@enduml`;
    await expect(projectSlices().definedBy("src/(**)/").should().adhereToDiagram(diagram)).toPassAsync();
  });

  it("Domain não depende de nenhuma outra camada", async () => {
    for (const layer of ["Application", "Infrastructure", "API"]) {
      await expect(projectFiles().inFolder("src/Domain/**").shouldNot().dependOnFiles().inFolder(`src/${layer}/**`)).toPassAsync();
    }
  });

  it("Application não depende de Infrastructure nem de API", async () => {
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/API/**")).toPassAsync();
  });

  it("os triggers (API/Functions) não acessam a Infrastructure diretamente", async () => {
    await expect(projectFiles().inFolder("src/API/Functions/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
  });

  it("não há dependências circulares", async () => {
    await expect(projectFiles().inFolder("src/**").should().haveNoCycles()).toPassAsync();
  });
});

describe("Vertical Slice", () => {
  it("CalculateFreight e ProcessDeliveryEvent são independentes", async () => {
    await expect(projectFiles().inFolder("src/Application/Features/CalculateFreight/**").shouldNot().dependOnFiles().inFolder("src/Application/Features/ProcessDeliveryEvent/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Application/Features/ProcessDeliveryEvent/**").shouldNot().dependOnFiles().inFolder("src/Application/Features/CalculateFreight/**")).toPassAsync();
  });

  it("casos de uso seguem a convenção <Feature>UseCase.ts", async () => {
    await expect(projectFiles().inFolder("src/Application/Features/**").should().haveName(/^[A-Z]\w+UseCase\.ts$/)).toPassAsync();
  });
});

describe("Dependências externas confinadas", () => {
  it("@azure/functions só aparece na camada API", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !imports(f.content, "@azure/functions") || f.path.includes("src/API/"), "@azure/functions só na API");
    await expect(rule).toPassAsync();
  });

  it("chamadas HTTP (fetch) só existem em Infrastructure/Http", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !/\bfetch\(/.test(f.content) || f.path.includes("Infrastructure/Http"), "fetch só no adaptador HTTP");
    await expect(rule).toPassAsync();
  });

  it("o domínio é puro (sem process.env)", async () => {
    const rule = projectFiles().inFolder("src/Domain/**").should().adhereTo((f) => !f.content.includes("process.env"), "domínio sem process.env");
    await expect(rule).toPassAsync();
  });

  it("nenhum arquivo passa de 150 linhas", async () => {
    await expect(metrics().inFolder("src/**").count().linesOfCode().shouldBeBelow(150)).toPassAsync();
  });
});
