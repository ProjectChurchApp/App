# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# ⛪ ChurchApp

교회 전용 게시판 및 알림 앱입니다.

---

## 🛠 기술 스택

### 프론트엔드
- React Native (Expo Router)
- TypeScript
- Axios
- expo-notifications

### 백엔드
- Spring Boot 3
- Spring Security + JWT
- JPA / Hibernate
- MySQL

---

## 📁 프로젝트 구조

```
church/
├── front/   # React Native (Expo)
└── back/    # Spring Boot
```

---

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-repo/church.git
cd church
```

---

### 2. 백엔드 설정

#### 필수 파일 생성

**`back/src/main/resources/application-database.properties`**
```properties
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://DB주소:3306/DB이름?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=유저명
spring.datasource.password=비밀번호
```

**`back/src/main/resources/application-jwt.properties`**
```properties
jwt.secret=시크릿키 (32자 이상 권장)
jwt.access-expiration=900000
jwt.refresh-expiration=1209600000
```

#### DB 테이블 생성

```sql
CREATE TABLE push_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
```

#### 백엔드 실행

```bash
cd back
./gradlew bootRun
```

---

### 3. 프론트엔드 설정

#### 패키지 설치

```bash
cd front
npm install
```

#### 필수 파일 생성

**`front/.env`**
```
EXPO_PUBLIC_API_URL=http://서버주소:8080
EXPO_PUBLIC_PROJECT_ID=expo-project-id
```

> `EXPO_PUBLIC_PROJECT_ID`는 [expo.dev](https://expo.dev) 에서 확인

**`front/google-services.json`**

Firebase 콘솔 → 프로젝트 설정 → 일반 → 앱 목록에서 다운로드

#### 프론트 실행

```bash
npx expo start
```

---

## 🔔 푸시 알림 설정

푸시 알림은 실기기에서만 동작해요. (웹/시뮬레이터 불가)

1. [Firebase 콘솔](https://console.firebase.google.com) 에서 프로젝트 생성
2. Android 앱 등록 (`com.geonuk.churchapp`)
3. `google-services.json` 다운로드 → `front/` 폴더에 복사
4. EAS credentials 설정:
```bash
eas credentials
```
5. FCM V1 서비스 계정 키 등록

---

## 📱 빌드

### 개발 빌드 (실기기 테스트용)
```bash
eas build --profile development --platform android
```

### 프로덕션 빌드
```bash
eas build --profile production --platform android
```

---

## 👥 역할

| 역할 | 권한 |
|------|------|
| 목사 | 게시글 작성 / 수정 / 삭제 |
| 신도 | 게시글 읽기 |

> 현재는 모든 로그인 사용자가 작성 가능하도록 설정되어 있습니다.

---

## ⚠️ 주의사항

아래 파일들은 보안상 git에 올라가지 않아요. 직접 생성해야 합니다:

- `front/.env`
- `front/google-services.json`
- `back/src/main/resources/application-database.properties`
- `back/src/main/resources/application-jwt.properties`
