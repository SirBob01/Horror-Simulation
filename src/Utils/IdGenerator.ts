/**
 * Unique identifier
 */
type Id = number;

class IdGenerator {
  private currentId: Id;
  private static instance?: IdGenerator;

  /**
   * Manager for globally unique identifiers
   */
  constructor() {
    this.currentId = 0;
  }

  /**
   * Generate a new globally unique id
   */
  static generate() {
    if (!IdGenerator.instance) {
      IdGenerator.instance = new IdGenerator();
    }
    return ++IdGenerator.instance.currentId;
  }
}

export { IdGenerator };
export type { Id };
