
import type {
  CourseFilter,
  CourseFilterOption,
} from "../types/database";
import { mockCourses } from "./mockCourses";

const createMajorFilters = (): CourseFilterOption[] => {
  const collegeMap = new Map<
    string,
    Map<string, Set<string>>
  >();

  const directMajorSet = new Set<string>();

  mockCourses
    .filter((course) => course.category === "전공")
    .forEach((course) => {
      const {
        collegeName,
        facultyName,
        majorName,
      } = course;

      if (!collegeName) {
        directMajorSet.add(majorName);
        return;
      }

      if (!collegeMap.has(collegeName)) {
        collegeMap.set(
          collegeName,
          new Map<string, Set<string>>(),
        );
      }

      const facultyMap = collegeMap.get(collegeName)!;

      if (!facultyName) {
        if (!facultyMap.has("")) {
          facultyMap.set("", new Set<string>());
        }

        facultyMap.get("")!.add(majorName);
        return;
      }

      if (!facultyMap.has(facultyName)) {
        facultyMap.set(
          facultyName,
          new Set<string>(),
        );
      }

      facultyMap.get(facultyName)!.add(majorName);
    });

  let id = 100;

  const createMajorOption = (
    majorName: string,
  ): CourseFilterOption => ({
    id: id++,
    name: majorName,
    field: "majorName",
    value: majorName,
  });

  const options: CourseFilterOption[] = [];

  collegeMap.forEach((facultyMap, collegeName) => {
    const collegeChildren: CourseFilterOption[] = [];

    facultyMap.forEach(
      (majorSet, facultyName) => {
        if (!facultyName) {
          majorSet.forEach((majorName) => {
            collegeChildren.push(
              createMajorOption(majorName),
            );
          });

          return;
        }

        collegeChildren.push({
          id: id++,
          name: facultyName,
          children: Array.from(majorSet).map(
            createMajorOption,
          ),
        });
      },
    );

    options.push({
      id: id++,
      name: collegeName,
      children: collegeChildren,
    });
  });

  directMajorSet.forEach((majorName) => {
    options.push(createMajorOption(majorName));
  });

  return options;
};

const createGeneralEducationFilters =
  (): CourseFilterOption[] => {
    const areaMap = new Map<
      string,
      Set<string>
    >();

    mockCourses
      .filter((course) =>
        course.category.startsWith("교양"),
      )
      .forEach((course) => {
        const area =
          course.generalEducationArea;

        if (!area) {
          return;
        }

        if (!areaMap.has(area)) {
          areaMap.set(area, new Set<string>());
        }

        const electiveArea =
          course.generalEducationElectiveArea;

        if (electiveArea) {
          areaMap.get(area)!.add(electiveArea);
        }
      });

    let id = 200;

    return Array.from(areaMap).map(
      ([area, electiveAreas]) => ({
        id: id++,
        name: area,
        children:
          electiveAreas.size > 0
            ? Array.from(electiveAreas).map(
                (name) => ({
                  id: id++,
                  name,
                  field:
                    "generalEducationElectiveArea",
                  value: name,
                }),
              )
            : undefined,
        field:
          electiveAreas.size === 0
            ? "generalEducationArea"
            : undefined,
        value:
          electiveAreas.size === 0
            ? area
            : undefined,
      }),
    );
  };

// 최상위 카테고리를 목업 데이터에서 동적으로 생성
const createCategoryFilters = (): CourseFilter[] => {
  const categories = Array.from(
    new Set(
      mockCourses.map(
        (course) => course.category,
      ),
    ),
  );

  return categories.map(
    (category, index) => {
      let options: CourseFilterOption[] = [];

      if (category === "전공") {
        options = createMajorFilters();
      } else if (
        category.startsWith("교양")
      ) {
        options =
          createGeneralEducationFilters();
      }

      return {
        id: index + 1,
        name: category,
        isFixed: false,
        options,
      };
    },
  );
};

export const createCourseFilters =
  (): CourseFilter[] => {
    return [
      // 최상위 카테고리
      ...createCategoryFilters(),

      // 고정 필터
      {
        id: 1001,
        name: "학년",
        isFixed: true,
        options: [
          {
            id: 100101,
            name: "1학년",
            field: "targetGrade",
            value: 1,
          },
          {
            id: 100102,
            name: "2학년",
            field: "targetGrade",
            value: 2,
          },
          {
            id: 100103,
            name: "3학년",
            field: "targetGrade",
            value: 3,
          },
          {
            id: 100104,
            name: "4학년",
            field: "targetGrade",
            value: 4,
          },
        ],
      },

      {
        id: 1002,
        name: "요일",
        isFixed: true,
        options: [
          {
            id: 100201,
            name: "월",
            field: "schedules.dayOfWeek",
            value: "월",
          },
          {
            id: 100202,
            name: "화",
            field: "schedules.dayOfWeek",
            value: "화",
          },
          {
            id: 100203,
            name: "수",
            field: "schedules.dayOfWeek",
            value: "수",
          },
          {
            id: 100204,
            name: "목",
            field: "schedules.dayOfWeek",
            value: "목",
          },
          {
            id: 100205,
            name: "금",
            field: "schedules.dayOfWeek",
            value: "금",
          },
        ],
      },

      {
        id: 1003,
        name: "수업 형태",
        isFixed: true,
        options: [
          {
            id: 100301,
            name: "대면",
            field: "isOnline",
            value: false,
          },
          {
            id: 100302,
            name: "온라인",
            field: "isOnline",
            value: true,
          },
        ],
      },
    ];
  };

