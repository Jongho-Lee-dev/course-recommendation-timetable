
import { toJpeg } from "html-to-image";

/**
 * 지정한 DOM 요소를 JPG 이미지로 변환해 다운로드합니다
 */
export async function downloadElementAsJpg(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  await document.fonts.ready;

  const bounds = element.getBoundingClientRect();

  const width = Math.ceil(
    Math.max(bounds.width, element.scrollWidth),
  );

  const height = Math.ceil(
    Math.max(bounds.height, element.scrollHeight),
  );

  if (!width || !height) {
    throw new Error("캡처할 시간표 영역이 비어 있습니다.");
  }

  try {
    const imageUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      width,
      height,

      // 시간표 상단의 버튼은 이미지에서 제외합니다.
      filter: (node) => {
        return !(
          node instanceof HTMLElement &&
          node.tagName === "BUTTON"
        );
      },
    });

    const link = document.createElement("a");

    link.href = imageUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("시간표 이미지 다운로드 실패:", error);
    throw new Error("시간표 JPG 생성에 실패했습니다.");
  }
}
