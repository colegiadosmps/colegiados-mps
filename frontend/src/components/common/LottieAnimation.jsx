import Lottie from "lottie-react";
import { getLottieByName } from "../../utils/lottieMap";

const LottieAnimation = ({
  name,
  width = 140,
  height = 140,
  loop = true,
  autoplay = true,
  className = "",
  fallback = null,
}) => {
  const animationData = getLottieByName(name);

  if (!animationData) {
    return fallback || <div className="lottie-fallback">Animacao indisponivel</div>;
  }

  try {
    return (
      <Lottie
        animationData={animationData}
        autoplay={autoplay}
        className={className}
        loop={loop}
        style={{ width, height }}
      />
    );
  } catch (_error) {
    return fallback || <div className="lottie-fallback">Animacao indisponivel</div>;
  }
};

export default LottieAnimation;
