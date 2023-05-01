import { shallowCompare } from "../../src/GlobalStore.utils";

describe("shallowCompare", () => {
  it("should return true if the objects are the same", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, object)).toBe(true);
  });

  it("should return true if the objects are the same", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, object)).toBe(true);
  });

  it("should return true if the objects are the same", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, object)).toBe(true);
  });

  it("should return true if the objects are the same", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, object)).toBe(true);
  });

  it("should return false if the objects are different", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, { ...object })).toBe(true);
  });

  it("should return false if the objects are different", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, { ...object, c: 3 } as unknown)).toBe(false);
  });

  it("should return false if the objects are different", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, { ...object, a: 3 })).toBe(false);
  });

  it("should return false if the objects are different", () => {
    const object = { a: 1, b: 2 };

    expect(shallowCompare(object, { ...object, a: 3, b: 4 })).toBe(false);
  });
});
