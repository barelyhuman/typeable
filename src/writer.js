export const createCodeWriter = () => {
  const interfaces = []
  return {
    addInterface: props => {
      const int = createInterface(props.name, props.isExported)
      interfaces.push(int)
      return int
    },
    getInterface: name => {
      return interfaces.find(x => x.name == name)
    },
    print: () => {
      return interfaces.map(x => x.print())
    },
  }
}

export const createInterface = (name, isExported) => {
  const properties = []
  return {
    name,
    isExported,
    getProperty: name => {
      return properties.find(x => x.name == name)
    },
    addProperty: props => {
      const property = properties.push(
        createInterfaceProperty(props.name, props.type)
      )
      return property
    },
    print: () => {
      return `\n${
        isExported ? 'export ' : ''
      }interface ${name} {\n\t${properties
        .map(x => x.print())
        .join('\n\t')}\n}\n`
    },
  }
}

const createInterfaceProperty = (name, type) => {
  return {
    name,
    type,
    print: () => {
      return `${name}: ${type || 'undefined'}`
    },
  }
}
