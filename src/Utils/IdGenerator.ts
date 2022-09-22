class IdGenerator {
  private current_id: number;
  private static instance?: IdGenerator;

  /**
   * Manager for globally unique identifiers
   */
  constructor() {
    this.current_id = 0;
  }

  /**
   * Generate a new globally unique id
   */
  static generate() {
    if (!IdGenerator.instance) {
      IdGenerator.instance = new IdGenerator();
    }
    return ++IdGenerator.instance.current_id;
  }
}

export { IdGenerator };
