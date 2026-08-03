$ErrorActionPreference = 'Stop'
$sourceDir = 'D:\Pickleball\Content\28-xam-legacy fullfoam'
$inputVideo = Join-Path $sourceDir 'IMG_2832.MOV'
$legacyLogo = 'D:\Pickleball\legacy\logo sword\xam-sword.png'
$voice = Join-Path $sourceDir 'voice-ok.mp3'
$output = Join-Path $sourceDir 'FSPORT_FullFoam_Legacy_FINAL.mp4'
$ass = Join-Path $PSScriptRoot 'edit_fullfoam_legacy.ass'
$assFilterPath = $ass.Replace('\', '/').Replace(':', '\:')

ffmpeg -y -hide_banner `
  -i $inputVideo `
  -loop 1 -i $legacyLogo `
  -i $voice `
  -f lavfi -t 30 -i "sine=frequency=55:sample_rate=48000" `
  -f lavfi -t 30 -i "sine=frequency=110:sample_rate=48000" `
  -filter_complex "
    [0:v]trim=start=0.25:end=25.25,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=1.8,
    scale=1120:1992:force_original_aspect_ratio=increase,
    crop=1080:1920:(iw-ow)/2+12*sin(t*0.7):(ih-oh)/2,
    eq=contrast=1.045:brightness=0.035:saturation=0.86:gamma=1.055:gamma_weight=0.82,
    colorbalance=bs=.018:gs=.010:rs=-.004:bm=.008:gm=.005,
    unsharp=5:5:0.55:3:3:0.2,
    drawbox=x=0:y=0:w=iw:h=135:color=0x0B0D10@0.52:t=fill,
    drawbox=x=0:y=1670:w=iw:h=250:color=0x0B0D10@0.46:t=fill,
    drawbox=x=54:y=1518:w=972:h=2:color=0xD8D8D8@0.75:t=fill,
    ass='$assFilterPath',fps=30[footage];
    [1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,
    gblur=sigma=38,eq=brightness=-0.24:contrast=1.32:saturation=0.08,fps=30[logoBg];
    [1:v]scale=980:-2,eq=brightness=0.02:contrast=1.30:saturation=0.04,
    zoompan=z='if(lte(on,30),1.16-0.0043*on,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=84:s=980x653:fps=30,
    format=rgba,fade=t=in:st=0.18:d=0.45:alpha=1,fade=t=out:st=2.45:d=0.25:alpha=1[logoFg];
    [logoBg][logoFg]overlay=(W-w)/2:(H-h)/2,
    drawbox=x='-260+620*t':y=0:w=95:h=1920:color=white@0.15:t=fill,
    drawbox=x=90:y=1580:w=900:h=2:color=0xDADADA@0.55:t=fill,
    fade=t=in:st=0:d=0.18,fade=t=out:st=2.55:d=0.25,setpts=PTS-STARTPTS[intro];
    [intro][footage]xfade=transition=fadeblack:duration=0.28:offset=2.62[v];
    [2:a]adelay=2900|2900,volume=1.34,highpass=f=90,lowpass=f=11500,acompressor=threshold=-18dB:ratio=2.2:attack=8:release=120[voice];
    [3:a]volume=0.035,tremolo=f=0.18:d=0.35[bed1];
    [4:a]volume=0.018,tremolo=f=0.27:d=0.5[bed2];
    [bed1][bed2][voice]amix=inputs=3:duration=longest:normalize=0,
    alimiter=limit=0.92,afade=t=in:st=0:d=0.5,afade=t=out:st=28.6:d=0.8[a]
  " `
  -map '[v]' -map '[a]' `
  -t 29.4 -r 30 `
  -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p `
  -c:a aac -b:a 192k -ar 48000 `
  -movflags +faststart `
  $output

ffprobe -v error -show_entries format=filename,duration,size,bit_rate -of json $output
