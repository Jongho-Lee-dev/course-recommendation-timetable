
/**
 * 지정한 DOM 요소를 JPG 이미지로 변환해 다운로드합니다.
 * SVG foreignObject와 Canvas를 사용합니다.
 */
export async function downloadElementAsJpg(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  await document.fonts.ready;

  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(bounds.width, element.scrollWidth));
  const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));

  if (!width || !height) {
    throw new Error("캡처할 시간표 영역이 비어 있습니다.");
  }

  const clone = element.cloneNode(true) as HTMLElement;

  // 현재 브라우저에 적용된 스타일을 복사합니다.
  const copyComputedStyles = (source: Element, target: Element) => {
    const computed = window.getComputedStyle(source);
    const targetElement = target as HTMLElement;

    for (let i = 0; i < computed.length; i += 1) {
      const property = computed[i];

      targetElement.style.setProperty(
        property,
        computed.getPropertyValue(property),
      );
    }

    Array.from(source.children).forEach((child, index) => {
      const targetChild = target.children[index];

      if (targetChild) {
        copyComputedStyles(child, targetChild);
      }
    });
  };

  
copyComputedStyles(element, clone);

// 새로고침 버튼은 이미지에서 제외합니다.
clone.querySelectorAll("button").forEach((button) => button.remove());

// Canvas 보안 오류를 방지하기 위해 이미지 리소스를 제거합니다.
const elements = [clone, ...Array.from(clone.querySelectorAll("*"))];

elements.forEach((item) => {
  const htmlElement = item as HTMLElement;

  // 외부 이미지가 포함될 수 있는 CSS 배경 제거
  htmlElement.style.backgroundImage = "none";
  htmlElement.style.borderImageSource = "none";
  htmlElement.style.maskImage = "none";
  htmlElement.style.setProperty("-webkit-mask-image", "none");
  htmlElement.style.listStyleImage = "none";
});

// HTML 이미지 및 SVG 이미지 제거
clone.querySelectorAll("img, svg image").forEach((image) => {
  image.remove();
});


  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.backgroundColor = "#ffffff";

  const serialized = new XMLSerializer().serializeToString(clone);

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xhtml="http://www.w3.org/1999/xhtml"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <foreignObject
        x="0"
        y="0"
        width="${width}"
        height="${height}"
      >
        ${serialized}
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });

  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    // SVG를 이미지로 변환합니다.
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("SVG 시간표 이미지 변환에 실패했습니다."));

      image.src = objectUrl;
    });

    // Canvas 생성
    const scale = 2;
    const canvas = document.createElement("canvas");

    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas를 생성하지 못했습니다.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    // JPG 변환
    const jpgBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("JPG 파일 생성에 실패했습니다."));
          }
        },
        "image/jpeg",
        0.95,
      );
    });

    // 다운로드 실행
    const downloadUrl = URL.createObjectURL(jpgBlob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
