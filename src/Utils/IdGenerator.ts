class IdGenerator {
  private discarded: number[];
  private current_id: number;
  private static instance?: IdGenerator;

  /**
   * Manager for globally unique identifiers
   */
  constructor() {
    this.discarded = [];
    this.current_id = 0;
  }

  /**
   * Get the singleton instance
   *
   * @returns GUIdGenerator instance
   */
  static get_instance() {
    if (!IdGenerator.instance) {
      IdGenerator.instance = new IdGenerator();
    }
    return IdGenerator.instance;
  }

  /**
   * Generate a new globally unique id
   */
  generate() {
    const recycle = this.discarded.pop();
    if (recycle) {
      return recycle;
    } else {
      return this.current_id++;
    }
  }

  /**
   * Allow an existing id to be recycled during generation
   *
   * @param id
   */
  discard(id: number) {
    this.discarded.push(id);
  }
}

export { IdGenerator };
