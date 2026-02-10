
$body = @{
    testTitle = "Manual Eval Test"
    testQuestionId = "TEST-001"
    commonTestEnv = "Test Environment"
    question = "What is the capital of France?"
    responseA = @{ content = "Paris"; env = "Env A" }
    responseB = @{ content = "London"; env = "Env B" }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/manual-eval" -Method Post -Body $body -ContentType "application/json"
