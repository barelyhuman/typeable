export class CodeWriter {
  interfaces = []

  constructor() {}

  addInterface(props) {
    const int = new CodeWriterInterface(props)
    this.interfaces.push(int)
    return int
  }

  getInterface(name) {
    return this.interfaces.find(x => x.name == name)
  }

  print() {
    return this.interfaces.map(x => x.print())
  }
}

class CodeWriterInterface {
  name = ''
  isExported = false
  properties = []

  constructor(options) {
    this.name = options.name
    this.isExported = options.isExported
    this.properties = []
  }

  /**
   *
   * @param {object} props
   * @param {string} props.name
   * @param {string} props.type
   */
  addProperty(props) {
    const prop = new CodeWriterInterfaceProperty(props)
    this.properties.push(prop)
    return prop
  }

  getProperty(name) {
    return this.properties.find(x => x.name == name)
  }

  print() {
    return `\n${this.isExported ? 'export ' : ''}interface ${
      this.name
    } {\n\t${this.properties.map(x => x.print()).join('\n\t')}\n}\n`
  }
}

class CodeWriterInterfaceProperty {
  name
  type
  constructor(options) {
    this.name = options.name
    this.type = options.type
  }

  print() {
    return `${this.name}: ${this.type || 'undefined'}`
  }
}
