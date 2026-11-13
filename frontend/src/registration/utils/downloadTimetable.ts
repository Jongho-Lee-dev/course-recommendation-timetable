/**
 * 지정한 DOM 요소를 JPG 이미지로 변환해 다운로드합니다.
 * 외부 이미지 변환 패키지 없이 브라우저의 SVG foreignObject와 Canvas를 사용합니다.
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

  // Tailwind 등 외부 스타일시트에 의존하지 않도록 현재 계산된 스타일을 복사합니다.
  const copyComputedStyles = (source: Element, target: Element) => {
    const computed = window.getComputedStyle(source);
    const targetElement = target as HTMLElement;

    for (let i = 0; i < computed.length; i += 1) {
      const property = computed[i];
      targetElement.style.setProperty(
        property,
        computed.getPropertyValue(property),
        computed.getPropertyPriority(property),
      );
    }

    const sourceChildren = Array.from(source.children);
    const targetChildren = Array.from(target.children);
    sourceChildren.forEach((child, index) => {
      const targetChild = targetChildren[index];
      if (targetChild) copyComputedStyles(child, targetChild);
    });
  };

  copyComputedStyles(element, clone);
  // 시간표 상단의 새로고침 버튼은 이미지에 포함하지 않습니다.
  clone.querySelectorAll("button").forEach((button) => button.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.backgroundColor = "#ffffff";

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject x="0" y="0" width="100%" height="100%">
        ${serialized}
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("시간표 이미지를 생성하지 못했습니다."));
    });

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 변환을 시작할 수 없습니다.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    const jpgBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("JPG 파일 생성에 실패했습니다."));
        },
        "image/jpeg",
        0.95,
      );
    });

    const downloadUrl = URL.createObjectURL(jpgBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
