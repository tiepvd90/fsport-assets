from __future__ import annotations

from datetime import timedelta
from pathlib import Path
import json
import subprocess

from gtts import gTTS


ROOT = Path(r"D:\WEBSITE\Code\26\fsport-frontend")
SLIDES_DIR = ROOT / "tmp" / "ppt_preview_font_fixed"
OUT_DIR = Path(r"D:\DEMO")
WORK_DIR = OUT_DIR / "video_ngu_am_tieng_trung_assets"
VIDEO_PATH = OUT_DIR / "Video_Giao_an_Ngu_am_Tieng_Trung_song_ngu.mp4"
SRT_PATH = OUT_DIR / "Video_Giao_an_Ngu_am_Tieng_Trung_phu_de_song_ngu.srt"
TRANSCRIPT_PATH = OUT_DIR / "Kich_ban_giong_doc_song_ngu_Trung_Viet.txt"

ZH_SPEED = 0.92
VI_SPEED = 0.96
LANGUAGE_PAUSE = 0.75
LEAD_SILENCE = 0.30
TAIL_SILENCE = 1.00


NARRATIONS = [
    {
        "title": "第一课：汉语语音",
        "zh": "大家好，欢迎学习汉语语音。本课学习声母、韵母和声调。请认真听，观察老师的口型，然后跟着朗读。",
        "vi": "Xin chào, chào mừng bạn đến với bài học ngữ âm tiếng Trung. Trong bài này, chúng ta sẽ học thanh mẫu, vận mẫu và thanh điệu. Hãy lắng nghe, quan sát khẩu hình của giáo viên, sau đó đọc theo.",
    },
    {
        "title": "学习目标与课堂流程",
        "zh": "本课有三个目标。第一，认识汉语拼音的声母、韵母和音节结构。第二，掌握正确的唇形和舌位。第三，读准四个声调和轻声。课堂中，我们会按照听、看、模仿、对比和自我纠正的顺序练习。",
        "vi": "Bài học có ba mục tiêu. Thứ nhất, nhận diện thanh mẫu, vận mẫu và cấu trúc âm tiết Pinyin. Thứ hai, đặt đúng hình dáng môi và vị trí lưỡi. Thứ ba, đọc đúng bốn thanh điệu và thanh nhẹ. Chúng ta sẽ luyện theo trình tự: nghe, quan sát, bắt chước, đối chiếu và tự sửa.",
    },
    {
        "title": "声母：发音部位",
        "zh": "先学习声母。双唇音，请跟读：波，坡，摸，佛。舌尖音：得，特，呢，了。舌根音：哥，科，喝。舌面音：鸡，七，西。翘舌音：知，吃，师，日。请注意送气和不送气，也要分清：早和找，擦和叉，苏和书，去和处。",
        "vi": "Trước hết là thanh mẫu. Với âm môi, hãy chú ý phân biệt âm bật hơi và không bật hơi. Với âm đầu lưỡi, đầu lưỡi chạm hoặc lướt vùng ngay sau răng trên. Âm gốc lưỡi được tạo khi phần sau của lưỡi nâng lên. Âm mặt lưỡi đi với i hoặc uy. Khi đọc ch, sh và r, đầu lưỡi cong nhẹ. Hãy luyện phân biệt các cặp âm trên màn hình.",
    },
    {
        "title": "韵母与音节结构",
        "zh": "汉语音节一般由声母、韵母和声调组成。单韵母，请跟读：啊，哦，鹅，衣，乌，迂。复韵母发音时，口型要自然滑动。鼻韵母结尾是恩时，舌尖接触上齿龈；结尾是昂时，舌根抬起。现在拼读：妈，好，学。",
        "vi": "Một âm tiết tiếng Trung thường gồm thanh mẫu, vận mẫu và thanh điệu. Với vận mẫu đơn, hãy mở miệng rõ và giữ âm ổn định. Với vận mẫu kép, khẩu hình chuyển động liền mạch. Âm mũi kết thúc bằng n dùng đầu lưỡi, còn âm kết thúc bằng ng dùng gốc lưỡi. Bây giờ hãy ghép và đọc ba âm tiết: ma, hảo và xuế.",
    },
    {
        "title": "四声与轻声",
        "zh": "声调非常重要。请听并跟读。第一声，高而平：妈。第二声，由低到高：麻。第三声，先降后升：马。第四声，从高到低，短而有力：骂。轻声，短而轻：吗。再来一次：妈，麻，马，骂，吗。注意变调：两个第三声连在一起，第一个读成第二声，比如，你好。不在第四声前面，也读成第二声，比如，不是。",
        "vi": "Thanh điệu có vai trò rất quan trọng. Thanh một cao và ngang. Thanh hai đi từ thấp lên cao. Thanh ba hạ thấp rồi đi lên. Thanh bốn rơi nhanh và mạnh. Thanh nhẹ được đọc ngắn và nhẹ. Hãy nghe lại: ma thanh một, ma thanh hai, ma thanh ba, ma thanh bốn và ma thanh nhẹ. Khi hai thanh ba đứng cạnh nhau, âm đầu chuyển thành thanh hai, như trong từ nỉ hảo. Bất trước thanh bốn cũng chuyển thành thanh hai, như trong cụm bú sư.",
    },
    {
        "title": "拼写规则与常见错误",
        "zh": "拼音有三个关键规则。第一，ü 跟 j、q、x 相拼时，省略两点，写作 ju、qu、xu。女和绿里面的 ü，仍然保留两点。第二，没有声母时，i 前面加 y，u 前面加 w，ü 写成 yu。第三，知、吃、诗、日、资、词、思后面的 i，不读成普通的衣。纠音时，请放慢速度，夸张口型，并用录音对比。",
        "vi": "Có ba quy tắc Pinyin cần nhớ. Thứ nhất, khi uy ghép với j, q hoặc x, hai dấu chấm được lược bỏ; nhưng sau n và l thì vẫn giữ. Thứ hai, khi không có thanh mẫu, i chuyển sang dạng bắt đầu bằng y, u bắt đầu bằng w, còn uy viết với y. Thứ ba, chữ i trong zhi, chi, shi, ri, zi, ci và si không đọc giống âm i thông thường. Khi sửa phát âm, hãy nói chậm, phóng đại khẩu hình và ghi âm để đối chiếu.",
    },
    {
        "title": "综合练习与出口卡",
        "zh": "现在进行综合练习。第一组，请读：妈，麻，马，骂。第二组，请分清：早和找，去和处，分和风，麻和马。第三组，请读句子：你好。我学习汉语。这不是书。最后，请录下自己的声音，选一个最难的音，再练习三遍。谢谢，再见。",
        "vi": "Bây giờ chúng ta luyện tập tổng hợp. Nhóm một, đọc bốn thanh của âm ma. Nhóm hai, phân biệt các cặp âm dễ nhầm trên màn hình. Nhóm ba, đọc ba câu: Xin chào. Tôi học tiếng Trung. Đây không phải là sách. Cuối cùng, hãy ghi âm giọng đọc của bạn, chọn một âm khó nhất và luyện lại ba lần. Cảm ơn và hẹn gặp lại.",
    },
]


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "json", str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def srt_time(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    hours, rem = divmod(total_ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, millis = divmod(rem, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    slide_paths = [SLIDES_DIR / f"Slide{i}.PNG" for i in range(1, 8)]
    missing = [str(p) for p in slide_paths if not p.exists()]
    if missing:
        raise FileNotFoundError("Missing rendered slides: " + ", ".join(missing))

    clips: list[Path] = []
    durations: list[float] = []
    for idx, item in enumerate(NARRATIONS, start=1):
        audio_zh = WORK_DIR / f"audio_zh_{idx:02}.mp3"
        audio_vi = WORK_DIR / f"audio_vi_{idx:02}.mp3"
        audio = WORK_DIR / f"audio_bilingual_{idx:02}.m4a"
        clip = WORK_DIR / f"clip_{idx:02}.mp4"
        gTTS(text=item["zh"], lang="zh-CN", slow=False).save(str(audio_zh))
        gTTS(text=item["vi"], lang="vi", slow=False).save(str(audio_vi))
        zh_duration = probe_duration(audio_zh) / ZH_SPEED
        vi_duration = probe_duration(audio_vi) / VI_SPEED
        run([
            "ffmpeg", "-y",
            "-i", str(audio_zh),
            "-i", str(audio_vi),
            "-f", "lavfi", "-t", str(LANGUAGE_PAUSE),
            "-i", "anullsrc=r=48000:cl=mono",
            "-filter_complex",
            (
                f"[0:a]atempo={ZH_SPEED},aresample=48000,asetpts=PTS-STARTPTS[zh];"
                f"[1:a]atempo={VI_SPEED},aresample=48000,asetpts=PTS-STARTPTS[vi];"
                "[2:a]aresample=48000,asetpts=PTS-STARTPTS[gap];"
                "[zh][gap][vi]concat=n=3:v=0:a=1[out]"
            ),
            "-map", "[out]", "-c:a", "aac", "-b:a", "160k", str(audio),
        ])
        combined_duration = probe_duration(audio)
        clip_duration = combined_duration + LEAD_SILENCE + TAIL_SILENCE
        fade_out_start = max(clip_duration - 0.38, 0)
        audio_fade_start = max(clip_duration - 0.42, 0)
        run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", str(slide_paths[idx - 1]),
            "-i", str(audio),
            "-vf",
            (
                "scale=1920:1080:force_original_aspect_ratio=decrease,"
                "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=white,"
                "format=yuv420p,"
                f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_start:.3f}:d=0.35"
            ),
            "-af",
            (
                f"adelay={int(LEAD_SILENCE * 1000)}:all=1,"
                f"apad=pad_dur={TAIL_SILENCE},afade=t=out:st={audio_fade_start:.3f}:d=0.35"
            ),
            "-t", f"{clip_duration:.3f}",
            "-r", "30",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
            "-movflags", "+faststart",
            str(clip),
        ])
        clips.append(clip)
        durations.append(clip_duration)
        print(f"slide={idx} zh={zh_duration:.2f}s vi={vi_duration:.2f}s total={clip_duration:.2f}s")

    concat_list = WORK_DIR / "concat.txt"
    concat_list.write_text(
        "".join(f"file '{clip.as_posix()}'\n" for clip in clips),
        encoding="utf-8",
    )
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy", "-movflags", "+faststart", str(VIDEO_PATH),
    ])

    srt_lines: list[str] = []
    cursor = 0.0
    for idx, (item, duration) in enumerate(zip(NARRATIONS, durations), start=1):
        zh_audio = WORK_DIR / f"audio_zh_{idx:02}.mp3"
        vi_audio = WORK_DIR / f"audio_vi_{idx:02}.mp3"
        zh_len = probe_duration(zh_audio) / ZH_SPEED
        vi_len = probe_duration(vi_audio) / VI_SPEED
        zh_start = cursor + LEAD_SILENCE
        zh_end = zh_start + zh_len
        vi_start = zh_end + LANGUAGE_PAUSE
        vi_end = min(vi_start + vi_len, cursor + duration - TAIL_SILENCE)
        srt_lines.extend([
            str(idx * 2 - 1),
            f"{srt_time(zh_start)} --> {srt_time(zh_end)}",
            item["zh"],
            "",
            str(idx * 2),
            f"{srt_time(vi_start)} --> {srt_time(vi_end)}",
            item["vi"],
            "",
        ])
        cursor += duration
    SRT_PATH.write_text("\n".join(srt_lines), encoding="utf-8-sig")

    transcript = [
        "KỊCH BẢN GIỌNG ĐỌC TIẾNG TRUNG / 中文配音稿",
        "Giọng 1: tiếng Trung phổ thông | Giọng 2: tiếng Việt",
        "Thứ tự trên mỗi slide: tiếng Trung → ngắt ngắn → tiếng Việt",
        "",
    ]
    for idx, item in enumerate(NARRATIONS, start=1):
        transcript.extend([
            f"SLIDE {idx} — {item['title']}",
            item["zh"],
            f"Gợi ý tiếng Việt: {item['vi']}",
            "",
        ])
    TRANSCRIPT_PATH.write_text("\n".join(transcript), encoding="utf-8-sig")

    final_duration = probe_duration(VIDEO_PATH)
    print(f"video={VIDEO_PATH}")
    print(f"duration={final_duration:.2f}s")
    print(f"size={VIDEO_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
