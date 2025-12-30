# S3 Media Uploader - Setup Guide

이 플러그인을 사용하기 위해 Obsidian 설정에서 다음 값들을 입력해야 합니다.

## 필수 설정 값

플러그인을 설치한 후 **Settings → S3 Media Uploader**에서 다음 정보를 입력하세요:

### 1. API Endpoint
AWS API Gateway 엔드포인트 URL

**입력할 값:**
```
https://5njxe0w1we.execute-api.ap-northeast-2.amazonaws.com/prod
```

**설명:** Lambda 함수를 호출하기 위한 API Gateway URL입니다.

---

### 2. S3 Bucket
AWS S3 버킷 이름

**입력할 값:**
```
jake-posting-img-bucket-1749733497
```

**설명:** 업로드된 미디어 파일이 저장되는 S3 버킷 이름입니다.

---

### 3. AWS Region
AWS 리전 (기본값: ap-northeast-2)

**입력할 값:**
```
ap-northeast-2
```

**설명:** S3 버킷이 위치한 AWS 리전입니다. (서울 리전)

---

## 선택적 설정

### Enable Progress Bar
업로드 진행 상태 표시 여부 (기본값: ON)

### Auto Insert Code
업로드 완료 후 자동으로 HTML 코드 삽입 여부 (기본값: ON)

---

## 사용 방법

### 방법 1: 리본 아이콘 클릭
왼쪽 사이드바에서 **구름 업로드 아이콘**을 클릭하여 업로드 창을 엽니다.

### 방법 2: 커맨드 팔레트
1. `Ctrl/Cmd + P`를 눌러 커맨드 팔레트 열기
2. "Upload media to S3" 입력
3. 엔터 키를 눌러 업로드 창 열기

### 파일 업로드
1. 업로드 창에서 **드래그 앤 드롭** 또는 **클릭하여 파일 선택**
2. 여러 파일을 동시에 선택 가능
3. **Upload** 버튼 클릭
4. 업로드 완료 후 자동으로 HTML 코드가 에디터에 삽입됩니다

---

## 지원 파일 형식

- 이미지: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- 비디오: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`

---

## 백엔드 인프라

이 플러그인은 다음 AWS 서비스와 연동됩니다:

- **API Gateway**: Presigned URL 생성 및 업로드 완료 알림
- **Lambda Functions**:
  - `post-img-upload-presign`: S3 Presigned URL 생성
  - `post-img-upload-convert-webp`: WebP 변환 (이미지만)
- **S3**: 미디어 파일 저장소
- **SQS FIFO Queue**: WebP 변환 작업 큐
- **Airtable**: 업로드된 파일 메타데이터 저장

---

## 문제 해결

### API Endpoint 오류
- API Gateway URL이 정확한지 확인하세요
- Lambda 함수가 배포되어 있는지 확인하세요

### 업로드 실패 (403 Forbidden)
- S3 버킷 이름이 정확한지 확인하세요
- Lambda IAM 권한이 올바르게 설정되어 있는지 확인하세요

### 업로드 후 코드가 삽입되지 않음
- Settings에서 "Auto Insert Code" 옵션이 활성화되어 있는지 확인하세요
- 에디터가 활성화된 상태인지 확인하세요

---

## 라이선스

MIT License
