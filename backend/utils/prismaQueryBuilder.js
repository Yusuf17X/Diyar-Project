class PrismaQueryBuilder {
  constructor(queryString) {
    this.queryString = queryString;
    this.prismaArgs = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert numeric query strings to numbers and build 'where' clause
    if (Object.keys(queryObj).length > 0) {
      const parsed = Object.entries(queryObj).reduce((acc, [key, value]) => {
        // 1. Check if its actually a string
        // 2. Make sure it isnt just empty spaces
        // 3. Make sure it can actually be parsed as a valid number
        const isNumericString =
          typeof value === "string" && value.trim() !== "" && !isNaN(value);

        acc[key] = isNumericString ? Number(value) : value;
        return acc;
      }, {});

      this.prismaArgs.where = parsed;
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").map((field) => {
        if (field.startsWith("-")) {
          // '-' means descending
          return { [field.substring(1)]: "desc" };
        }
        return { [field]: "asc" };
      });
      this.prismaArgs.orderBy = sortBy;
    } else {
      this.prismaArgs.orderBy = { createdAt: "desc" };
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {});
      this.prismaArgs.select = fields;
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = limit * (page - 1);

    this.prismaArgs.take = limit;
    this.prismaArgs.skip = skip;

    return this;
  }

  build() {
    return this.prismaArgs;
  }
}

export default PrismaQueryBuilder;
