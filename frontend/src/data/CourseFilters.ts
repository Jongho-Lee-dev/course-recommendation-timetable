import type {
  CourseFilter,
  CourseFilterOption,
  CourseListItem,
  FilterCategory,
} from "../types/database";
import { mockFilterCategories } from "./mockFilterCategories";
import { mockCourses } from "./mockCourses";

type FilterValue = NonNullable<CourseFilterOption["value"]>;

const isFilterValue = (value: unknown): value is FilterValue =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

export const getCourseFieldValues = (
  course: CourseListItem,
  field: string,
): unknown[] => {
  const parts = field.split(".");

  const getValues = (
    current: unknown,
    index: number,
  ): unknown[] => {
    if (current === null || current === undefined) {
      return [];
    }

    if (index >= parts.length) {
      return [current];
    }

    if (Array.isArray(current)) {
      return current.flatMap((item) => getValues(item, index));
    }

    if (typeof current === "object" && parts[index] in current) {
      return getValues(
        (current as Record<string, unknown>)[parts[index]],
        index + 1,
      );
    }

    return [];
  };

  return getValues(course, 0);
};

export const matchesCourseFilter = (
  course: CourseListItem,
  filter: Pick<CourseFilterOption, "field" | "value">,
): boolean => {
  if (!filter.field || filter.value === undefined) {
    return true;
  }

  return getCourseFieldValues(course, filter.field).some(
    (value) => value === filter.value,
  );
};

const createDynamicOptions = (
  courses: CourseListItem[],
  fields: string[],
  nextId: () => number,
): CourseFilterOption[] => {
  if (fields.length === 0) {
    return [];
  }

  const [field, ...remainingFields] = fields;
  const valueGroups = new Map<FilterValue, CourseListItem[]>();
  const coursesWithoutValue: CourseListItem[] = [];

  courses.forEach((course) => {
    const values = Array.from(
      new Set(
        getCourseFieldValues(course, field).filter(isFilterValue),
      ),
    );

    if (values.length === 0) {
      coursesWithoutValue.push(course);
      return;
    }

    values.forEach((value) => {
      const group = valueGroups.get(value) ?? [];
      group.push(course);
      valueGroups.set(value, group);
    });
  });

  const options: CourseFilterOption[] = Array.from(
    valueGroups,
    ([value, matchingCourses]) => {
      const children = createDynamicOptions(
        matchingCourses,
        remainingFields,
        nextId,
      );

      return {
        id: nextId(),
        name: String(value),
        field,
        value,
        children: children.length > 0 ? children : undefined,
      };
    },
  );

  if (remainingFields.length > 0 && coursesWithoutValue.length > 0) {
    options.push(
      ...createDynamicOptions(
        coursesWithoutValue,
        remainingFields,
        nextId,
      ),
    );
  }

  return options;
};

export const createCourseFilters = (): CourseFilter[] => {
  const categories = mockFilterCategories;
  const childrenByParent = new Map<number, FilterCategory[]>();

  categories.forEach((category) => {
    if (category.parentId === undefined) {
      return;
    }

    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category);
    childrenByParent.set(category.parentId, children);
  });

  let optionId =
    Math.max(...categories.map((category) => category.id), 0) + 1;
  const nextId = () => optionId++;

  const buildOption = (
    category: FilterCategory,
    availableCourses: CourseListItem[],
  ): CourseFilterOption => {
    const matchingCourses = availableCourses.filter((course) =>
      matchesCourseFilter(course, category),
    );
    const configuredChildren = (
      childrenByParent.get(category.id) ?? []
    ).map((child) => buildOption(child, matchingCourses));
    const dynamicChildren = createDynamicOptions(
      matchingCourses,
      category.childFields ?? [],
      nextId,
    );
    const children = [...configuredChildren, ...dynamicChildren];

    return {
      id: category.id,
      name: category.name,
      field: category.field,
      value: category.value,
      children: children.length > 0 ? children : undefined,
    };
  };

  return categories
    .filter((category) => category.parentId === undefined)
    .map((category) => {
      const matchingCourses = mockCourses.filter((course) =>
        matchesCourseFilter(course, category),
      );
      const options = (childrenByParent.get(category.id) ?? []).map(
        (child) => buildOption(child, matchingCourses),
      );

      return {
        id: category.id,
        name: category.name,
        isFixed: category.isFixed ?? false,
        field: category.field,
        value: category.value,
        options,
      };
    });
};
